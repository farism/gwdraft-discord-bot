import { decodeTemplate, skillbarToImage } from './skills'
import fs from 'fs'

const skills = require('../assets/skills.json')

describe('skills helpers', () => {
  describe('decode template', () => {
    it('does stuff', async () => {})
    it('decodes a skill template', async () => {
      const skillbar = decodeTemplate('OgNToYm2wJX8LGrCRQSZlWgLA')

      if (skillbar) {
        const canvas = await skillbarToImage(skillbar)
        const out = fs.createWriteStream(__dirname + '/test.png')
        const stream = canvas.createPNGStream()
        stream.pipe(out)
      }
    })
  })
})
