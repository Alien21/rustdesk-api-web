import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createPinia } from 'pinia'

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const file = await import(moduleUrl(await source('src/utils/file.js')))
const authUrl = moduleUrl(await source('src/utils/auth.js'))
const auth = await import(authUrl)

// Only unrelated API/router dependencies are stubbed; logout runs in a real Pinia store.
const replacements = {
  pinia: import.meta.resolve('pinia'),
  '@/api/user': moduleUrl('export const current = () => {}; export const login = () => {}'),
  '@/utils/auth': authUrl,
  '@/store/router': moduleUrl('export const useRouteStore = () => ({ addRoutes() {} })'),
  '@/store/app': moduleUrl('export const useAppStore = () => ({ loadConfig() {} })'),
  '@/api/login': moduleUrl('export const oidcAuth = () => {}; export const oidcQuery = () => {}'),
}
let userSource = await source('src/store/user.js')
for (const [specifier, url] of Object.entries(replacements)) {
  userSource = userSource.replace(`from '${specifier}'`, `from '${url}'`)
}
const { useUserStore } = await import(moduleUrl(userSource))

test('CSV neutralizes formula headers and cells while preserving ordinary CSV text', async () => {
  const result = await file.jsonToCsv([{
    '=SUM(A1)': '=1+1',
    normal: 'Alice, "PC"',
    plus: ' +SUM(A1)',
    minus: '-1',
    at: '@SUM(A1)',
    control: '\u0000=1',
    tab: '\tplain',
    newline: '\nplain',
  }]).text()
  assert.equal(result, [
    '"\'=SUM(A1)","normal","plus","minus","at","control","tab","newline"',
    '"\'=1+1","Alice, ""PC""","\' +SUM(A1)","\'-1","\'@SUM(A1)","\'\u0000=1","\'\tplain","\'\nplain"',
  ].join('\r\n'))
})

test('CSV handles empty exports, missing values, null, numbers, and booleans', async () => {
  assert.equal(await file.jsonToCsv([]).text(), '')
  const csv = file.jsonToCsv([{ a: null, b: undefined, c: 0, d: false }, { a: 'řádek' }])
  assert.equal(csv.type, 'text/csv;charset=utf-8')
  assert.equal(await csv.text(), '"a","b","c","d"\r\n"","","0","false"\r\n"řádek","","",""')
})

test('logout removes both token copies, OIDC and user data, and resets live Pinia state', () => {
  const values = new Map([['unrelated-preference', 'keep']])
  const previousStorage = globalThis.localStorage
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
  try {
    const user = useUserStore(createPinia())
    const initialState = JSON.parse(JSON.stringify(user.$state))
    auth.setToken('test-token')
    auth.setCode('test-oidc')
    localStorage.setItem('user_info', '{"name":"old-user"}')
    user.$patch({ nickname: 'old', username: 'old-user', email: 'old@example.test', token: 'test-token', role: 'admin', avatar: 'old.png', route_names: ['admin'] })
    user.logout()
    assert.equal(auth.getToken(), null)
    assert.equal(auth.getCode(), null)
    assert.deepEqual(Object.fromEntries(values), { 'unrelated-preference': 'keep' })
    assert.deepEqual(JSON.parse(JSON.stringify(user.$state)), initialState)
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage
    else globalThis.localStorage = previousStorage
  }
})

test('exported quoted headers keep peer IDs and escaped names on import', async () => {
  const rows = (await file.jsonToCsv([{ id: '123456789', alias: 'Office "PC"' }]).text()).split('\r\n')
  const keys = rows[0].split(',').map(file.unquoteCsvCell)
  const values = rows[1].split(',').map(file.unquoteCsvCell)
  const peer = Object.fromEntries(keys.map((key, index) => [key, values[index]]))
  assert.equal(peer.id, '123456789')
  assert.equal(peer.alias, 'Office "PC"')
  assert.equal(file.unquoteCsvCell('id'), 'id')
})
