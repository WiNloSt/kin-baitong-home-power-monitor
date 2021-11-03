import { google } from 'googleapis'
import axios from 'axios'
import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(utc)
dayjs.extend(timezone)

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

export async function updatePowerMeter(spreadsheetId: string, meterDeviceId: string) {
  const startDate = dayjs(await readLastRowValue(spreadsheetId))
    .add(1, 'minute')
    .format()
  /** @type {object[]} */
  const powerMeterData = await fetchPowerMeterData(meterDeviceId, startDate)
  const spreadsheetData = powerMeterData.map((record: any) => {
    return [
      record.KEY_TIMESTAMP,
      record.DATA_VALUE_1,
      record.DATA_VALUE_2,
      record.DATA_VALUE_3,
      record.DATA_VALUE_4,
      record.DATA_VALUE_5,
      record.DATA_VALUE_6,
      record.DATA_VALUE_7,
      record.DATA_VALUE_8,
    ]
  })

  appendToSpreadsheet(spreadsheetId, spreadsheetData)
}

async function fetchPowerMeterData(meterDeviceId: string, startDate = '2021-07-01T00:00:00+07:00') {
  const endDate = dayjs().tz('Asia/Bangkok').format()

  const url = `http://space-ui.momoinfinitech.com/sql_line_chart_data.php?select_device_id=${meterDeviceId}&view_mode=MINUTE&txt_tags=data01,data02,data03,data04,data05,data06,data07,data08&start_date=${startDate}&end_date=${endDate}&db_separate=true&select_device_type=ENERGY`
  return axios.get(url).then((response) => {
    return JSON.parse(response.data.substring(0, response.data.indexOf(']') + 1))
  })
}

async function readLastRowValue(spreadsheetId: string) {
  const sheet = await getSheet()
  return (
    sheet.spreadsheets.values
      .append({
        spreadsheetId,
        range: 'Monitor data!A:A',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[null]],
        },
      })
      // @tsignore
      .then((response) => {
        const updatedRange = response.data?.updates?.updatedRange || ''

        const replaceRegEx = /\d+/
        const indexAfterLastRow = Number(updatedRange.match(replaceRegEx)?.[0]) || -1
        const lastRowRange = updatedRange.replace(replaceRegEx, String(indexAfterLastRow - 1))

        return sheet.spreadsheets.values.get({
          spreadsheetId,
          range: lastRowRange,
        })
      })
      // @tsignore
      .then((response) => {
        return response?.data?.values?.[0][0]
      })
      // @tsignore
      .catch((error) => {
        console.error(error)
        throw error
      })
  )
}

async function appendToSpreadsheet(spreadsheetId: string, rows: any) {
  const sheet = await getSheet()
  return (
    sheet.spreadsheets.values
      .append({
        spreadsheetId,
        range: 'Monitor data!A:A',
        valueInputOption: 'RAW',
        requestBody: { values: rows },
      })
      // @tsignore
      .catch((error) => {
        console.error(error)
        throw error
      })
  )
}

async function getSheet() {
  return google.sheets({
    version: 'v4',
    auth: await auth.getClient(),
  })
}
