import * as functions from 'firebase-functions'

import { updatePowerMeter } from './util'

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info('Hello logs!', { structuredData: true })
//   response.send('Hello from Firebase!')
// })

export const updatePowerMeterData = functions.pubsub
  .schedule('every 10 minutes')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    const { spreadsheet_id, meter_device_id } = functions.config().power_meter
    await updatePowerMeter(spreadsheet_id, meter_device_id)
    return null
  })
