const fs = require("fs");
const path = require("path");

const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/**
 * Helper
 * {{inc @index}}
 */
Handlebars.registerHelper("inc", function (value) {
    return value + 1;
});

/**
 * Generate PDF
 */

const generatePdf = async (
    templateName,
    data
) => {

    // Template Path

    const templatePath = path.join(
        __dirname,
        "../../templates/pdf",
        `${templateName}.hbs`
    );

    // Read Template

    const source =
        fs.readFileSync(
            templatePath,
            "utf8"
        );

    // Compile Template

    const template =
        Handlebars.compile(source);

    const html =
        template(data);

    // Launch Browser

    const browser =
        await puppeteer.launch({

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],

        });

    try {

        const page =
            await browser.newPage();

        await page.setContent(
            html,
            {
                waitUntil: "networkidle0",
            }
        );

        const pdf =
            await page.pdf({

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