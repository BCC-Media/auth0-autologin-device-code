require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const app = express();
const port = parseInt(process.env.PORT) || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const apiKey = process.env.API_KEY;
if (!apiKey || apiKey.length < 6) {
    console.error('A safe API key is required (minimum 6 characters)');
    process.exit(1);
}
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
if (!AUTH0_DOMAIN) {
    console.error('AUTH0_DOMAIN is required');
    process.exit(1);
}

app.post('/confirm', async (req, res) => {
    const { user_code, api_key } = req.query;
    if (!user_code) {
        return res.status(400).send('Device code is required (?user_code)');
    }
    if (!api_key) {
        return res.status(400).send('API key is required (?api_key)');
    }
    if (api_key !== apiKey) {
        return res.status(401).send('Invalid API key');
    }

    try {
        const browser = await getBrowser();
        const page = await browser.newPage();
        await page.goto(`https://${AUTH0_DOMAIN}/activate?user_code=${user_code}`);

        const button = await page.$('button[value="confirm"]');
        try {
            await button.click();
        } catch (e) {

        }

        // Fill the login form and submit
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log('Filling login form...');
        console.log('- Filling email...');
        await page.type('input[name="username"]', process.env.LOGIN_EMAIL);
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]'),
        ]);
        console.log('- Filling password...');
        await page.type('input[name="password"]', process.env.LOGIN_PASSWORD);
        await page.click('button[type="submit"]');

        await new Promise(resolve => setTimeout(resolve, 8000));
        // Handle the consent screen
        const accept = await page.$('button[value="accept"]');
        try { await accept.click(); } catch { }
        await new Promise(resolve => setTimeout(resolve, 8000));

        await browser.close();
        res.status(200).send();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


async function getBrowser() {
    if (process.env.NODE_ENV === 'production') {
        return await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            ignoreDefaultArgs: ['--disable-extensions'],
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    return await puppeteer.launch({
        headless: false,
        slowMo: 1000,
    });
}