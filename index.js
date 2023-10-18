import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;

// I used this API: https://rapidapi.com/traveltables/api/cost-of-living-and-prices. 
// There is a limit of 10 requests per hour, and that's why I saved the cities in a txt file.
const baseUrl = 'https://cost-of-living-and-prices.p.rapidapi.com';
const headers = {
      'X-RapidAPI-Key': 'YOUR-API-KEY',
      'X-RapidAPI-Host': 'cost-of-living-and-prices.p.rapidapi.com'
    };

// I used this exchange API: https://www.exchangerate-api.com/docs/pair-conversion-requests. There are 1500 free requests.
const exchangeApi = 'YOUR-EXCHANGE-API-KEY'
const exchangeUrl = 'https://v6.exchangerate-api.com/v6/'

var allCities = [];
var cityData = {};


app.use(bodyParser.urlencoded({ extended: true }));    

app.use(express.static("public"));

app.get("/", (req, res) => {
    //   try {
    //       const response = await axios.request({url: baseUrl + '/cities', headers: headers});
    //       allCities = response.data.cities;
    //       fs.writeFile("cities.txt", JSON.stringify(allCities), (err) => {
    //         if (err) throw err;
    //         console.log("file succesfully created")
    //     })
          res.render("index.ejs")
    //   } catch (error) {
    //       console.error(error);
    //   }
    });

app.post("/", async(req, res) => {
    const cityName = req.body['city-name'].normalize('NFD').toLowerCase();
    fs.readFile('cities.txt', 'utf-8', (err, data) => {
        if (err) throw err;
        allCities = JSON.parse(data);
        const cities = [];
        allCities.forEach(city => {
            if (city.city_name.normalize('NFD').toLowerCase().includes(cityName)) {
                cities.push(city);
            };
        });
        if (cities.length === 0){
            var error = 'No matching results.';
            res.render("index.ejs", {error: error});
        }
        res.render('index.ejs', {cities: cities});
    });
});

app.post('/prices', async (req, res) => {
    const selected = req.body.selectedLink.split(',');
    const params = {
        city_name: selected[0],
        country_name: selected[1]
      };
      console.log(params);
      try {
          const response = await axios.request({url: baseUrl + "/prices", params: params, headers: headers});
          cityData = response.data;
          console.log(cityData);
          res.render("index.ejs", {data: cityData, multiplier: 1, curr: cityData.prices[0].currency_code});
      } catch (error) {
          console.error(error);
      }
  });

  app.post('/currency', async (req, res) => {
    const localCurrency = cityData.prices[0].currency_code;
    const selectedCurrency = req.body.selectedValue;
    try{
        const response = await axios.request(`${exchangeUrl}${exchangeApi}/pair/${localCurrency}/${selectedCurrency}`);
        const multiplier = response.data.conversion_rate;
        console.log(multiplier);
        res.render("index.ejs", {data: cityData, multiplier: multiplier, curr: selectedCurrency});
    } catch (error) {
        console.error(error);
    }
  });

app.listen(port, () =>{
    console.log("Listening on port "+port)
});