#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { main } from './cli';

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    main();
}