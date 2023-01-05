const fs = require("fs");
const csvParser = require("csv-parser");
const fastcsv = require('fast-csv');
const ws = fs.createWriteStream("out.csv");

// e.g. 'Mintos' or 'Anlagen YTN - Mintos' for an hierarchy
const category = "Anlagen YTN - Mintos";

const numberFormat =
    new Intl.NumberFormat("de-DE",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format;

const dateFormat =
    new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format;


const writeCSV = (data) => {
    fastcsv
        .write(data, {
            headers: ["Datum", "Wertstellung", "Kategorie", "Name", "Verwendungszweck", "Konto", "Bank", "Betrag", "Währung"],
            quotes: true,
            delimiter: ';',
        })
        .pipe(ws);
}

const result = [];
const incomingPaymentMarker = "Eingehende Zahlungen vom Bankkonto";

fs.createReadStream("./data.csv")
    .pipe(csvParser())
    .on("data", (data) => {
        Object.keys(data).forEach(key => {
            if (key === "Transaktions-Nr.:") {
                data["Name"] = data[key];
            }
            if (key === "Einzelheiten") {
                data["Verwendungszweck"] = data[key];
            }
            if (key === "Umsatz") {
                var v = parseFloat(data[key]);
                console.log(data[key], "=>", v);
                data["Betrag"] = numberFormat(v);
            }
            if (key === "Datum") {
                if(data[key]) {
                    var d = new Date(data[key]);
                    data["Datum"] = dateFormat(d);
                    data["Wertstellung"] = dateFormat(d);
                }
            }
        });
        data["Bank"] = "Mintos";
        if (data["Verwendungszweck"] === incomingPaymentMarker) {
            data["Kategorie"] = "Umbuchung";
        } else {
            data["Kategorie"] = category;
        }
        console.log("data", data);
        if(data["Datum"]) {
            result.push(data);
        }
    })
    .on("end", () => {
        //        console.log(result);
        writeCSV(result.reverse());
    });

