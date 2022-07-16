import fs from 'fs'
import path from 'path'
import wtf from 'wtf_wikipedia'

wtf.extend((models, templates) => {
  // create a custom parser function
  templates.gr = (tmpl, _, parse) => {
    let { list } = parse(tmpl)

    if (list) {
      return `${list[0]}...${list[1]}`
    }

    return ''
  }
})

const skills = fs.readFileSync(path.resolve('./assets/gwwikiskills.xml'), 'utf8')

const docs = wtf(skills)

const outputMapById = docs
  .infoboxes()
  .map((ib) => {
    const json = ib.json()

    return Object.keys(json).reduce((acc, key) => {
      acc[key] = json[key]?.number || json[key]?.text

      return acc
    }, {})
  })
  .sort((a, b) => a.id?.number - b.id?.number)
  .reduce((acc, ib) => {
    if (ib?.id) {
      acc[ib.id] = ib
    }

    return acc
  }, {})

fs.writeFileSync(path.resolve('./assets/skillsMapById.json'), JSON.stringify(outputMapById, 0, 2))
