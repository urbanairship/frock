import net from 'net'

export default connectCommandClient

function connectCommandClient (socket, argv, ready) {
  const client = net.connect({path: socket}, () => {
    console.log('connected')
    client.write(argv.command.trim())
  })

  let success = false
  let code

  client.on('data', data => {
    code = Number(data.toString())
    client.end()
  })

  client.on('end', () => {
    if (!code) {
      success = true
    }
    ready(null, {success, code})
  })
}
