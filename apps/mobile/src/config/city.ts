import { parseCityConfig, type CityConfig } from '@krakow-bez-barier/core';

import raw from '../../../../cities/krakow.json';

export const city: CityConfig = parseCityConfig(raw);
