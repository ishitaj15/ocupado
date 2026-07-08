import http from 'k6/http'
import { sleep, check } from 'k6'

export let options = {
  vus: 50,          // same 50 virtual users
  duration: '30s',  // same 30 seconds
}

export default function () {
  const payload = JSON.stringify({ status: 'ENGAGED' })

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  // Hit the ASYNC route
  const res = http.patch(
    'http://localhost:3000/api/machines/7de4969b-c80f-46e6-9877-d78122525ba7/status',
    payload,
    params
  )

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })

  sleep(1)
}