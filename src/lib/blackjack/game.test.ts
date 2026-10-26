import { describe, expect, it } from 'bun:test'
import type { Card } from './types'
import {
  acceptInsurance,
  dealInitialHands,
  declineInsurance,
  determineResult,
  playerHit,
  playerStand,
  startNewGame,
} from './game'

// What: the initial deal produces two hands and removes four cards from the deck.
describe('dealInitialHands', () => {
  it('deals two cards each in alternating order', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
    ] satisfies Card[]

    const { deck: remaining, playerHand, dealerHand } = dealInitialHands(deck)

    expect(playerHand).toEqual([deck[0], deck[2]])
    expect(dealerHand).toEqual([deck[1], deck[3]])
    expect(remaining.length).toBe(0)
  })

  it('throws when fewer than four cards remain', () => {
    expect(() => dealInitialHands([])).toThrow()
  })
})

// What: determineResult picks the correct winner based on totals and busts.
describe('determineResult', () => {
  it('awards the win to a non-busted player when the dealer busts', () => {
    const player = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '7' },
    ] satisfies Card[]
    const dealer = [
      { suit: 'clubs', rank: '10' },
      { suit: 'spades', rank: '9' },
      { suit: 'hearts', rank: '5' },
    ] satisfies Card[]

    expect(determineResult(player, dealer)).toBe('playerWin')
  })

  it('awards the win to the dealer when the player busts', () => {
    const player = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '9' },
      { suit: 'clubs', rank: '5' },
    ] satisfies Card[]
    const dealer = [
      { suit: 'spades', rank: '10' },
      { suit: 'hearts', rank: '7' },
    ] satisfies Card[]

    expect(determineResult(player, dealer)).toBe('dealerWin')
  })

  it('returns push when totals are equal', () => {
    const hand = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '7' },
    ] satisfies Card[]

    expect(determineResult(hand, hand)).toBe('push')
  })

  it('awards the higher non-busted total', () => {
    const player = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '8' },
    ] satisfies Card[]
    const dealer = [
      { suit: 'spades', rank: '10' },
      { suit: 'clubs', rank: '7' },
    ] satisfies Card[]

    expect(determineResult(player, dealer)).toBe('playerWin')
  })
})

// What: starting a new game creates a valid initial state and ends immediately on blackjack.
describe('startNewGame', () => {
  it('deals two cards to the player and dealer', () => {
    // Use a fixed deck where neither side starts with blackjack.
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
    ] satisfies Card[]
    const game = startNewGame(deck)

    expect(game.playerHand.length).toBe(2)
    expect(game.dealerHand.length).toBe(2)
    expect(game.phase).toBe('playerTurn')
    expect(game.result).toBeNull()
  })

  it('ends the round when the player starts with blackjack', () => {
    const deck = [
      { suit: 'hearts', rank: 'A' },
      { suit: 'diamonds', rank: '5' },
      { suit: 'spades', rank: 'K' },
      { suit: 'clubs', rank: '6' },
    ] satisfies Card[]
    const game = startNewGame(deck)

    expect(game.phase).toBe('finished')
    expect(game.result).toBe('playerWin')
  })
})

// What: insurance is offered only while the dealer's up card is an Ace, and
// both answers settle the side bet against the hole card.
describe('insurance', () => {
  it('offers insurance before the player acts when the dealer up card is an Ace', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: '7' },
    ] satisfies Card[]
    const game = startNewGame(deck)

    expect(game.phase).toBe('insuranceOffer')
    expect(game.result).toBeNull()
    expect(game.insuranceStake).toBeNull()
  })

  it('does not offer insurance when only the hole card is an Ace', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'K' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: 'A' },
    ] satisfies Card[]
    const game = startNewGame(deck)

    // Dealer natural resolves without a side-bet window.
    expect(game.phase).toBe('finished')
    expect(game.result).toBe('dealerWin')
  })

  it('pays 2:1 and finishes the round on a dealer natural', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: 'K' },
    ] satisfies Card[]
    const next = acceptInsurance(startNewGame(deck), 100)

    expect(next.insuranceStake).toBe(50)
    expect(next.insuranceResult).toBe('won')
    expect(next.phase).toBe('finished')
    expect(next.result).toBe('dealerWin')
  })

  it('keeps the main wager a push when both sides hold naturals', () => {
    const deck = [
      { suit: 'hearts', rank: 'A' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: 'K' },
      { suit: 'spades', rank: 'K' },
    ] satisfies Card[]
    const next = acceptInsurance(startNewGame(deck), 100)

    expect(next.insuranceResult).toBe('won')
    expect(next.phase).toBe('finished')
    expect(next.result).toBe('push')
  })

  it('forfeits the stake and continues normal play without a dealer natural', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: '7' },
      { suit: 'hearts', rank: '9' },
    ] satisfies Card[]
    const accepted = acceptInsurance(startNewGame(deck), 100)

    expect(accepted.insuranceStake).toBe(50)
    expect(accepted.insuranceResult).toBe('lost')
    expect(accepted.phase).toBe('playerTurn')

    const finished = playerStand(accepted)
    expect(finished.insuranceStake).toBe(50)
    expect(finished.insuranceResult).toBe('lost')
  })

  it('floors the stake to half of an odd bet to keep chips integral', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: '7' },
    ] satisfies Card[]

    expect(acceptInsurance(startNewGame(deck), 25).insuranceStake).toBe(12)
  })

  it('declining advances to the player turn without any insurance stake', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: '7' },
    ] satisfies Card[]
    const next = declineInsurance(startNewGame(deck))

    expect(next.phase).toBe('playerTurn')
    expect(next.insuranceStake).toBeNull()
    expect(next.insuranceResult).toBeNull()
  })

  it('declining still resolves a player blackjack immediately', () => {
    const deck = [
      { suit: 'hearts', rank: 'A' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: 'K' },
      { suit: 'spades', rank: '7' },
    ] satisfies Card[]
    const next = declineInsurance(startNewGame(deck))

    expect(next.phase).toBe('finished')
    expect(next.result).toBe('playerWin')
    expect(next.insuranceStake).toBeNull()
  })

  it('rejects insurance actions outside the insurance window', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
    ] satisfies Card[]
    const playerTurn = startNewGame(deck)

    expect(() => acceptInsurance(playerTurn, 100)).toThrow()
    expect(() => declineInsurance(playerTurn)).toThrow()

    const finished = playerStand(playerTurn)
    expect(() => acceptInsurance(finished, 100)).toThrow()
    expect(() => declineInsurance(finished)).toThrow()
  })

  it('preserves the insurance stake across a hit', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: 'A' },
      { suit: 'clubs', rank: '6' },
      { suit: 'spades', rank: '7' },
      { suit: 'hearts', rank: '9' },
    ] satisfies Card[]
    const next = playerHit(acceptInsurance(startNewGame(deck), 100))

    expect(next.playerHand.length).toBe(3)
    expect(next.insuranceStake).toBe(50)
  })
})

// What: hitting adds one card and ends the round if the player busts.
describe('playerHit', () => {
  it('adds the next deck card to the player hand', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
      { suit: 'hearts', rank: '9' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const next = playerHit(game)

    expect(next.playerHand.length).toBe(game.playerHand.length + 1)
    expect(next.deck.length).toBe(game.deck.length - 1)
  })

  it('finishes the round when the player busts', () => {
    const deck = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '10' },
      { suit: 'clubs', rank: '5' },
      { suit: 'spades', rank: '7' },
      { suit: 'hearts', rank: 'K' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const next = playerHit(game)

    expect(next.phase).toBe('finished')
    expect(next.result).toBe('dealerWin')
  })

  it('throws when not in the player turn phase', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const finished = playerStand(game)

    expect(() => playerHit(finished)).toThrow()
  })
})

// What: standing triggers the dealer to draw until at least 17 and then resolves the round.
describe('playerStand', () => {
  it('finishes the round without the dealer drawing when the dealer already has 17', () => {
    const deck = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '10' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '9' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const next = playerStand(game)

    expect(next.phase).toBe('finished')
    expect(next.dealerHand.length).toBe(2)
  })

  it('lets the dealer draw until reaching at least 17', () => {
    const deck = [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '8' },
      { suit: 'spades', rank: '5' },
      { suit: 'hearts', rank: '6' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const next = playerStand(game)

    expect(next.dealerHand.length).toBeGreaterThan(2)
    expect(next.phase).toBe('finished')
  })

  it('throws when not in the player turn phase', () => {
    const deck = [
      { suit: 'hearts', rank: '5' },
      { suit: 'diamonds', rank: '6' },
      { suit: 'clubs', rank: '7' },
      { suit: 'spades', rank: '8' },
    ] satisfies Card[]
    const game = startNewGame(deck)
    const finished = playerStand(game)

    expect(() => playerStand(finished)).toThrow()
  })
})
