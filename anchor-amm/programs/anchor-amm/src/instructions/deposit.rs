// programs/amm/src/instructions/deposit.rs
use crate::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user_a: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_b: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_lp: Account<'info, TokenAccount>,

    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Deposit>, max_a: u64, max_b: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let reserve_a = pool.reserve_a;
    let reserve_b = pool.reserve_b;

    let (amount_a, amount_b, lp_mint_amount) = if reserve_a == 0 && reserve_b == 0 {
        // First deposit
        (max_a, max_b, (max_a as u128 * max_b as u128).isqrt() as u64)
    } else {
        let amount_a = max_a.min(reserve_a * max_b / reserve_b);
        let amount_b = max_b.min(reserve_b * max_a / reserve_a);
        let lp_mint_amount = (amount_a as u128 * pool.lp_supply as u128 / reserve_a as u128) as u64;
        (amount_a, amount_b, lp_mint_amount)
    };

    // Transfer tokens in
    let cpi_accounts = token::Transfer {
        from: ctx.accounts.user_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount_a,
    )?;

    let cpi_accounts = token::Transfer {
        from: ctx.accounts.user_b.to_account_info(),
        to: ctx.accounts.vault_b.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount_b,
    )?;

    // Mint LP tokens
    let seeds = &[
        b"pool",
        pool.token_a.as_ref(),
        pool.token_b.as_ref(),
        &[pool.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.lp_mint.to_account_info(),
        to: ctx.accounts.user_lp.to_account_info(),
        authority: pool.to_account_info(),
    };
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        ),
        lp_mint_amount,
    )?;

    pool.reserve_a = pool
        .reserve_a
        .checked_add(amount_a)
        .ok_or(AmmError::Overflow)?;
    pool.reserve_b = pool
        .reserve_b
        .checked_add(amount_b)
        .ok_or(AmmError::Overflow)?;
    pool.lp_supply = pool
        .lp_supply
        .checked_add(lp_mint_amount)
        .ok_or(AmmError::Overflow)?;

    Ok(())
}
