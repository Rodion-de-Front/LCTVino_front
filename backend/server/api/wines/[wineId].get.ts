import { wineDetail } from '../../utils/wines'

export default defineEventHandler((event) => wineDetail(getRouterParam(event, 'wineId') ?? ''))
