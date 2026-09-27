import { searchWines } from '../../utils/wines'

export default defineEventHandler((event) => searchWines(getRequestURL(event).searchParams))
