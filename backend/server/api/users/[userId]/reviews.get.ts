import { reviewsByAuthor } from '../../../utils/wines'

export default defineEventHandler((event) => reviewsByAuthor(getRouterParam(event, 'userId') ?? ''))
