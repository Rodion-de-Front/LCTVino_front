import { reviewsOfWine } from '../../../utils/wines'

export default defineEventHandler((event) => reviewsOfWine(getRouterParam(event, 'wineId') ?? ''))
