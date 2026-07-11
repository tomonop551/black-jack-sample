import { describe, expect, it } from 'bun:test'
import {
  type Card,
  createDeck,
  dealInitialHands,
  determineResult,
  handValue,
  isBlackjack,
  isBust,
  playerHit,
  playerStand,
  shuffleDeck,
  startNewGame,
} from './blackjack'

// What: a standard deck contains 52 unique cards.
describe('createDeck', () => {
  it('returns 52 cards', () => {
    const deck = createDeck()
    expect(deck.length).toBe(52)
  })

  it('contains every suit and rank combination', () => {
    const deck = createDeck()
    const suits = new Set(deck.map((card) => card.suit))
    const ranks = new Set(deck.map((card) => card.rank))

    expect(suits.size).toBe(4)
    expect(ranks.size).toBe(13)
  })
})

// What: shuffling reorders the deck without changing its contents.
describe('shuffleDeck', () => {
  it('keeps the same 52 cards after shuffling', () => {
    const deck = createDeck()
    const shuffled = shuffleDeck(deck)

    expect(shuffled.length).toBe(52)
    const byRankThenSuit = (a: Card, b: Card) =>
      a.rank.localeCompare(b.rank) || a.suit.localeCompare(b.suit)

    expect(shuffled.toSorted(byRankThenSuit)).toEqual(deck.toSorted(byRankThenSuit))
  })
})

// What: hand totals respect numeric cards, face cards, and flexible aces.
describe('handValue', () => {
  it('counts numbered cards at face value', () => {
    expect(handValue([{ suit: 'hearts', rank: '5' }])).toBe(5)
    expect(handValue([{ suit: 'hearts', rank: '10' }])).toBe(10)
  })

  it('counts face cards as 10', () => {
    expect(handValue([{ suit: 'clubs', rank: 'J' }])).toBe(10)
    expect(handValue([{ suit: 'diamonds', rank: 'Q' }])).toBe(10)
    expect(handValue([{ suit: 'spades', rank: 'K' }])).toBe(10)
  })

  it('counts ace as 11 when it does not bust the hand', () => {
    expect(handValue([{ suit: 'hearts', rank: 'A' }])).toBe(11)
  })

  it('counts ace as 1 when 11 would bust the hand', () => {
    expect(
      handValue([
        { suit: 'hearts', rank: 'A' },
        { suit: 'clubs', rank: 'K' },
        { suit: 'diamonds', rank: '9' },
      ]),
    ).toBe(20)
  })

  it('counts multiple aces correctly', () => {
    expect(
      handValue([
        { suit: 'hearts', rank: 'A' },
        { suit: 'diamonds', rank: 'A' },
        { suit: 'clubs', rank: '9' },
      ]),
    ).toBe(21)
  })
})

// What: a bust hand has a value greater than 21.
describe('isBust', () => {
  it('returns true for hands over 21', () => {
    expect(
      isBust([
        { suit: 'hearts', rank: '10' },
        { suit: 'diamonds', rank: '9' },
        { suit: 'clubs', rank: '5' },
      ]),
    ).toBe(true)
  })

  it('returns false for hands at or under 21', () => {
    expect(isBust([{ suit: 'hearts', rank: 'A' }])).toBe(false)
    expect(
      isBust([
        { suit: 'hearts', rank: 'A' },
        { suit: 'diamonds', rank: 'K' },
      ]),
    ).toBe(false)
  })
})

// What: a blackjack is exactly two cards totaling 21.
describe('isBlackjack', () => {
  it('returns true for an ace and a ten-value card', () => {
    expect(
      isBlackjack([
        { suit: 'hearts', rank: 'A' },
        { suit: 'spades', rank: 'Q' },
      ]),
    ).toBe(true)
  })

  it('returns false for non-blackjack hands', () => {
    expect(
      isBlackjack([
        { suit: 'hearts', rank: 'A' },
        { suit: 'spades', rank: 'Q' },
        { suit: 'clubs', rank: '9' },
      ]),
    ).toBe(false)
  })
})

// What: the initial deal produces two hands and removes four cards from the deck.
describe('dealInitialHands', () => {
  it('deals two cards each in alternating order', () => {
    const deck = createDeck()
    const { deck: remaining, playerHand, dealerHand } = dealInitialHands(deck)

    expect(playerHand).toEqual([deck[0], deck[2]])
    expect(dealerHand).toEqual([deck[1], deck[3]])
    expect(remaining.length).toBe(48)
  })

  it('throws when fewer than four cards remain', () => {
    expect(() => dealInitialHands(createDeck().slice(0, 3))).toThrow()
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
    const game = startNewGame(createDeck())
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
    const game = startNewGame(createDeck())
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
    const game = startNewGame(createDeck())
    const finished = playerStand(game)

    expect(() => playerStand(finished)).toThrow()
  })
})
