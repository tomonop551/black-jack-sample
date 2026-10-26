import { describe, expect, it } from 'bun:test'
import type { Card, Shoe } from './types'
import { dealInitialHands, determineResult, playerHit, playerStand, startNewGame, startRound } from './game'
import { createShoe, needsReshuffle, settleShoe } from './shoe'
import { handValue } from './scoring'

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

// What: startRound deals from the persistent shoe instead of a fresh deck,
// and only reshuffles at the round boundary once the cut card is passed.
describe('startRound', () => {
  // Position-only shoe with known cards; deterministic as long as no
  // reshuffle is triggered.
  function shoeOf(cards: Card[], dealt = 0, cutIndex = cards.length): Shoe {
    return { cards, dealt, cutIndex }
  }

  const cards = (ranks: string[]): Card[] =>
    ranks.map((rank, i) => ({ suit: (['hearts', 'diamonds', 'clubs', 'spades'] as const)[i % 4], rank: rank as Card['rank'] }))

  it('deals the four leading undealt cards without reshuffling', () => {
    const cards_ = cards(['5', '6', '7', '8', '9', '10', 'J', 'Q'])
    const shoe = shoeOf(cards_, 0, 100)
    const game = startRound(shoe)

    expect(game.playerHand).toEqual([cards_[0], cards_[2]])
    expect(game.dealerHand).toEqual([cards_[1], cards_[3]])
    expect(game.deck).toEqual(cards_.slice(4))
    // Same array reference is the proof that no reshuffle happened.
    expect(game.shoe?.cards).toBe(cards_)
    expect(game.shoe?.dealt).toBe(0)
  })

  it('ends the round on a blackjack dealt from the shoe', () => {
    const shoe = shoeOf(cards(['A', '5', 'K', '6', '2', '3', '4', '7']), 0, 100)
    const game = startRound(shoe)

    expect(game.phase).toBe('finished')
    expect(game.result).toBe('playerWin')
  })

  it('reshuffles at the boundary once the cut was passed', () => {
    // dealt 10 of 16: 6 cards remain, so the cut is the only reshuffle trigger.
    const cards_ = cards(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3'])
    const shoe = shoeOf(cards_, 10, 10)
    const game = startRound(shoe)

    expect(game.shoe?.dealt).toBe(0)
    expect(game.shoe?.cards).not.toBe(cards_)
    expect(game.shoe?.cutIndex).toBe(10)
    expect(game.deck.length).toBe(16 - 4)
  })

  it('reshuffles a nearly empty shoe even before the cut, so the deal cannot run dry', () => {
    const shoe = shoeOf(cards(['5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']), 8, 100)
    const game = startRound(shoe)

    expect(game.shoe?.dealt).toBe(0)
    expect(game.playerHand.length).toBe(2)
    expect(game.dealerHand.length).toBe(2)
  })

  it('lets a round deal past the cut and defers the reshuffle to the next boundary', () => {
    // Ranks cycle A,K,... so the dealer stands on the initial deal: 8+10=18.
    const shoe = shoeOf(
      [
        { suit: 'clubs', rank: '9' }, { suit: 'spades', rank: '8' }, { suit: 'hearts', rank: '10' },
        { suit: 'diamonds', rank: '7' }, { suit: 'clubs', rank: '6' }, { suit: 'spades', rank: '5' },
        { suit: 'hearts', rank: '7' }, { suit: 'diamonds', rank: '8' }, { suit: 'clubs', rank: '9' },
        { suit: 'spades', rank: '10' }, { suit: 'hearts', rank: 'J' }, { suit: 'diamonds', rank: 'Q' },
        { suit: 'clubs', rank: 'K' }, { suit: 'spades', rank: 'A' }, { suit: 'hearts', rank: '2' },
        { suit: 'diamonds', rank: '3' },
      ],
      6,
      10,
    )
    const game = startRound(shoe)
    expect(game.shoe?.cards).toBe(shoe.cards) // no reshuffle at the start

    const played = game.phase === 'playerTurn' ? playerStand(game) : game
    const settled = settleShoe(game.shoe as Shoe, played.deck)

    expect(played.phase).toBe('finished')
    expect(needsReshuffle(settled)).toBe(true)

    const next = startRound(settled)
    expect(next.shoe?.dealt).toBe(0)
    expect(next.shoe?.cards).not.toBe(shoe.cards)
  })
})

// What: a whole session of stand-only rounds consumes one 6-deck shoe across
// many rounds, reshuffles on the cut, and never throws for a short deck.
describe('shoe persistence across rounds', () => {
  it('plays many rounds from one shoe without running dry', () => {
    let shoe = createShoe()
    let reshuffles = 0

    for (let round = 0; round < 60; round++) {
      const boundaryReshuffle = needsReshuffle(shoe)
      if (boundaryReshuffle) reshuffles++

      const game = startRound(shoe)
      expect(game.shoe?.cards.length).toBe(312)

      const played = game.phase === 'playerTurn' ? playerStand(game) : game
      expect(played.phase).toBe('finished')
      // A silently-exhausted deck would strand the dealer under 17 after
      // drawing; a dealer may only sit below 17 on an initial blackjack
      // round, which ends before the dealer draws.
      const dealerValue = handValue(played.dealerHand)
      expect(dealerValue >= 17 || played.dealerHand.length === 2).toBe(true)

      shoe = settleShoe(game.shoe as Shoe, played.deck)
    }

    // 60 rounds consume at least 240 cards, past the 234-card cut, so the
    // boundary reshuffle must have fired at least once.
    expect(reshuffles).toBeGreaterThanOrEqual(1)
  })

  it('keeps the same shoe object identity between rounds before the cut', () => {
    const shoe = createShoe(6, 0.99) // cut near the end: no reshuffle for early rounds
    const first = startRound(shoe)
    const firstPlayed = first.phase === 'playerTurn' ? playerStand(first) : first
    const settled = settleShoe(first.shoe as Shoe, firstPlayed.deck)
    const second = startRound(settled)
    const secondPlayed = second.phase === 'playerTurn' ? playerStand(second) : second
    const secondSettled = settleShoe(second.shoe as Shoe, secondPlayed.deck)

    expect(secondSettled.cards).toBe(shoe.cards)
    expect(secondSettled.dealt).toBeGreaterThan(settled.dealt)
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
