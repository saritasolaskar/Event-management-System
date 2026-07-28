const fs = require("fs-extra");
const path = require("path");
const Handlebars = require("handlebars");
const puppeteer = require("puppeteer");

const generatePdf = async (templateName, data) => {

    const templatePath = path.join(
        __dirname,
        "../templates/pdf",
        `${templateName}.hbs`
    );

    const html = await fs.readFile(
        templatePath,
        "utf8"
    );

    const template =
        Handlebars.compile(html);

    const finalHtml =
        template(data);

    const browser =
        await puppeteer.launch({

            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],

        });

    const page =
        await browser.newPage();

    await page.setContent(
        finalHtml,
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

                bottom: "20px",

                left: "20px",

                right: "20px",

            },

        });

    await browser.close();

    return pdf;

};

module.exports = generatePdf;