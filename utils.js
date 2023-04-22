import { convertArrayToCSV } from 'convert-array-to-csv';
import fs from 'fs';


async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateCSVFile(data){
    const csvFromArrayOfObjects = convertArrayToCSV(data);
    fs.writeFile('./result_data/results.csv', csvFromArrayOfObjects, err => {
        if(err) console.log(18, err);
        console.log("Resulst are saved into CSV file, please check ./result_data directory");
    });
}

export { delay, generateCSVFile };