const TOKEN = "1811642396:AAEPiqTCt9iX0jFJhORyWb1LD0suTjU3uzQ"
const { query } = require('express')
const fs = require('fs')
const apiKey = 'aa7b330c3c854b82c3299f9b184fcabf'
const axios =  require('axios')
const TelegramApi = require('node-telegram-bot-api')
console.log('Bot has been started ...')

let city = '1',county; // заданный город и найденная страна
let lat = 0,lon = 0 //положение города на карте
let kol = 0,kolError = 0 //переменной для того, чтобы бот отправлял ответ один раз


const myRequest = (url) => {
  return new Promise((resolve, reject) => {
    axios.get(encodeURI(url))
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  })
}


const inline_keyboard = [
  //inline клавиатура
  [
    {
      text:'Погода',
      callback_data: 'weather'
    },
  ]
]

const bot = new TelegramApi(TOKEN, {
  polling:{
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
})

bot.setMyCommands([
  {command: '/start',description:'Включить бота'},
])

bot.on('callback_query',async(query) =>{
  if(query.data === 'weather'){
      //получение погоды в выбранном городе
      bot.sendMessage(query.message.chat.id,'Город:')
      bot.on('message', async (message) =>{
          city = message.text
          let lenCity = city.length;
          if(isNaN(parseFloat(city))  && lenCity > 1){
            await myRequest(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${apiKey}`)
            .then(async(data) => {
              const infoFromRequest = data;
              city = infoFromRequest.data[0].name
              county = infoFromRequest.data[0].country
              lat = infoFromRequest.data[0].lat
              lon = infoFromRequest.data[0].lon
          
              //получение данных о погоде
              const  infoFromRequestWeather = await myRequest(`https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}&lat=${lat}&lon=${lon}&units=metric`)
              if(kol == 0){
              bot.sendPhoto(message.chat.id,`https://openweathermap.org/img/wn/${infoFromRequestWeather.data.current.weather[0].icon}@2x.png`)
                .then(bot.sendMessage(message.chat.id,`      *The weather in ${city}, ${county}*
              _${infoFromRequestWeather.data.current.weather[0].description}_
Temperature: ${Math.floor(infoFromRequestWeather.data.current.temp)}°C
Fells like: ${Math.floor(infoFromRequestWeather.data.current.feels_like)}°C
Humidity: ${infoFromRequestWeather.data.current.humidity} %
Visibility (in meters): ${infoFromRequestWeather.data.current.visibility} m
Pressure: ${infoFromRequestWeather.data.current.pressure} Pa
Wind speed: ${Math.round(infoFromRequestWeather.data.current.wind_speed)} m/s`,{
                parse_mode: 'Markdown'
              }))
                .catch((err) => {if(kolError == 0) {bot.sendMessage(message.chat.id,`Произошло ошибка!
Выбирите действие сново!`); kolError = 1}})
              kol = 1
              }
      kolError = 0
    })
        .catch((err) =>{if(kolError == 0){bot.sendMessage(message.chat.id,`Города ${city} не существует!
Выбирите действие сново!`); kolError = 1}})
      }else{
        if(kolError == 0){
          bot.sendMessage(message.chat.id,`Это не город!
Выбирите действие сново!`); 
          kolError = 1
        }}
      })
    kolError = 0
    kol = 0
}
  bot.answerCallbackQuery({
    callback_query_id: query.id
  })
})

bot.onText(/\/start/,(message,[source,match]) =>{
  const chatId = message.chat.id
  
  bot.sendMessage(chatId,'Погода в любой точке мира!',{
    reply_markup: {
      inline_keyboard
    }
  })
})
