import { keyboardLift } from '../src/lib/keyboardInset'

const frame = (screenY: number, height: number) => ({ screenY, height })

describe('keyboardLift', () => {
  it('stays put when the window already ends on the keyboard', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 480,
        windowHeight: 480,
        screenHeight: 800,
        frame: frame(480, 320),
      }),
    ).toBe(0)
  })

  it('ignores a full-screen reported height once the visible frame has caught up', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 500,
        windowHeight: 500,
        screenHeight: 820,
        frame: frame(500, 820),
      }),
    ).toBe(0)
  })

  it('lifts by the measured overlap, not the reported height', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 800,
        windowHeight: 800,
        screenHeight: 840,
        frame: frame(480, 900),
      }),
    ).toBe(320)
  })

  it('does not pull the dialog down under the keyboard', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 700,
        windowHeight: 760,
        screenHeight: 800,
        frame: frame(740, 60),
      }),
    ).toBe(0)
  })

  it('shifts a full-screen container up when the window shrank but the keyboard top did not', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 800,
        windowHeight: 480,
        screenHeight: 800,
        frame: frame(800, 320),
      }),
    ).toBe(320)
  })

  it('caps a stale full-screen height so the dialog cannot leave the screen', () => {
    expect(
      keyboardLift({
        containerY: 0,
        containerHeight: 800,
        windowHeight: 800,
        screenHeight: 800,
        frame: frame(2000, 2000),
      }),
    ).toBe(680)
  })
})
