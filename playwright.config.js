import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./browser',use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:1000}},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:true},reporter:'list'});
