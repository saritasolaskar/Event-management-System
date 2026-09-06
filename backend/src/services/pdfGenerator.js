const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const AppError = require("../utils/AppError");

/**
 * Handlebars Helper
 * Usage: {{inc @index}}
 */
Handlebars.registerHelper("inc", (value) => value + 1);

/**
 * Generate PDF from Handlebars Template
 *
 * @param {String} templateName
 * @param {Object} data
 * @returns {Buffer}
 */
const generatePdf = async (templateName, data) => {

    // Template Path
    const templatePath = path.join(
        __dirname,
       "../templates/Pdf",
        `${templateName}.hbs`
    );

    // Validate Template
    if (!fs.existsSync(templatePath)) {
        throw new AppError(
            `PDF template '${templateName}' not found.`,
            404
        );
    }

    // Read Template
    const source = fs.readFileSync(
        templatePath,
        "utf8"
    );

    // Compile Template
    const template = Handlebars.compile(source);

    // Generate HTML
    const html = template(data);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
    });

    try {

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0",
        });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        });

        return pdf;

    } finally {

        await browser.close();

    }
};

module.exports = {
    generatePdf,
};