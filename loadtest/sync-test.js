import http from 'k6/http'
import { sleep, check } from 'k6'

export let options = {
  vus: 50,          // 50 virtual users
  duration: '30s',  // for 30 seconds
}

export default function () {
  const payload = JSON.stringify({ status: 'ENGAGED' })

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  // Hit the SYNC route
  const res = http.patch(
    'http://localhost:3000/api/machines/7de4969b-c80f-46e6-9877-d78122525ba7/status/sync',
    payload,
    params
  )

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 5000ms': (r) => r.timings.duration < 5000
  })

  sleep(1)
}