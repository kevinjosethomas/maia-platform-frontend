/* eslint-disable @typescript-eslint/ban-ts-comment */
import chroma from 'chroma-js'
import { normalize } from '..'
import { distToLine } from '../math'

export const combine = (c1: string, c2: string, scale: number) =>
  chroma.scale([c1, c2])(scale)

export const average = (c1: string, c2: string) => chroma.average([c1, c2])

export const computeColour = (nx: number, ny: number) => {
  const distToNx = distToLine([nx, ny], [1, 1, -1])
  const distToPx = distToLine([nx, ny], [-1, 1, 0])
  const sqrt2 = Math.sqrt(2)
  const normalizedNx = normalize(distToNx, -sqrt2 / 2, sqrt2 / 2)
  const normalizedPx = normalize(distToPx, -sqrt2 / 2, sqrt2 / 2)
  //   return combine('#000000', '#FFFFFF', normalizedNx).alpha(normalizedNx).hex()

  return combine(
    combine('#000000', '#FFFFFF', normalizedNx).alpha(normalizedNx).hex(),
    combine('#00FFE0', '#FF7A00', normalizedPx + 0.3).hex(),
    normalizedNx,
  ).hex()
}

export const generateColor = (
  stockfishRank: number,
  maiaRank: number,
  maxRank: number,
  redHex = '#FF0000',
  blueHex = '#0000FF',
): string => {
  /**
   * Generates a distinct hex color based on the ranks of a move in Stockfish and Maia outputs.
   *
   * @param stockfishRank - Rank of the move in Stockfish output (1 = best).
   * @param maiaRank - Rank of the move in Maia output (1 = best).
   * @param maxRank - Maximum rank possible (for normalizing ranks).
   * @param redHex - Hex code for the red color (default "#FF0000").
   * @param blueHex - Hex code for the blue color (default "#0000FF").
   *
   * @returns A more distinct blended hex color code.
   */

  const normalizeRank = (rank: number) =>
    Math.pow(1 - Math.min(rank / maxRank, 1), 2)

  const stockfishWeight = normalizeRank(stockfishRank)
  const maiaWeight = normalizeRank(maiaRank)

  const totalWeight = stockfishWeight + maiaWeight

  const stockfishBlend = totalWeight === 0 ? 0.5 : stockfishWeight / totalWeight
  const maiaBlend = totalWeight === 0 ? 0.5 : maiaWeight / totalWeight

  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.slice(1), 16)
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
  }

  const rgbToHex = ([r, g, b]: [number, number, number]): string => {
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
  }

  const redRgb = hexToRgb(redHex)
  const blueRgb = hexToRgb(blueHex)

  const blendedRgb: [number, number, number] = [
    Math.round(stockfishBlend * blueRgb[0] + maiaBlend * redRgb[0]),
    Math.round(stockfishBlend * blueRgb[1] + maiaBlend * redRgb[1]),
    Math.round(stockfishBlend * blueRgb[2] + maiaBlend * redRgb[2]),
  ]

  const enhance = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value * 1.2)))

  const enhancedRgb: [number, number, number] = blendedRgb.map(enhance) as [
    number,
    number,
    number,
  ]

  return rgbToHex(enhancedRgb)
}
