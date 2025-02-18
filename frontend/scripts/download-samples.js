import fs from 'fs'
import https from 'https'
import path from 'path'

const samples = [
  {
    name: 'kick.wav',
    url: 'https://static.wixstatic.com/mp3/523820_6702c0f87a884c0fb2f5acf2f4445a8d.wav',
  },
  {
    name: 'snare.wav',
    url: 'https://static.wixstatic.com/mp3/523820_f0c2f1d0d32c4d7a9b538f88b0e8ba0e.wav',
  },
  {
    name: 'hihat.wav',
    url: 'https://static.wixstatic.com/mp3/523820_f5b6aec517f94f65a8e0e2ded5f5c5c5.wav',
  },
]

const downloadFile = (url, path) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(path)
          response.pipe(file)
          file.on('finish', () => {
            file.close()
            resolve()
          })
        } else {
          response.resume()
          reject(new Error(`Request Failed With a Status Code: ${response.statusCode}`))
        }
      })
      .on('error', reject)
  })

const downloadSamples = async () => {
  const samplesDir = path.join(process.cwd(), 'public', 'samples')

  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true })
  }

  console.log('Downloading samples...')

  for (const sample of samples) {
    const filePath = path.join(samplesDir, sample.name)
    console.log(`Downloading ${sample.name}...`)
    try {
      await downloadFile(sample.url, filePath)
      console.log(`Downloaded ${sample.name}`)
    } catch (error) {
      console.error(`Failed to download ${sample.name}:`, error.message)
    }
  }

  console.log('All samples downloaded successfully!')
}

downloadSamples().catch(console.error) 