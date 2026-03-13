"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeSkillbar = exports.decodeTemplate = exports.getAttributeName = exports.getProfessionName = exports.AttributeNames = exports.ProfessionNames = exports.ProfessionAbbreviation = exports.Attribute = exports.Profession = void 0;
const path_1 = __importDefault(require("path"));
const skillsMapById = require('../assets/skillsMapById.json');
var Profession;
(function (Profession) {
    Profession[Profession["None"] = 0] = "None";
    Profession[Profession["Warrior"] = 1] = "Warrior";
    Profession[Profession["Ranger"] = 2] = "Ranger";
    Profession[Profession["Monk"] = 3] = "Monk";
    Profession[Profession["Necromancer"] = 4] = "Necromancer";
    Profession[Profession["Mesmer"] = 5] = "Mesmer";
    Profession[Profession["Elementalist"] = 6] = "Elementalist";
    Profession[Profession["Assassin"] = 7] = "Assassin";
    Profession[Profession["Ritualist"] = 8] = "Ritualist";
    Profession[Profession["Paragon"] = 9] = "Paragon";
    Profession[Profession["Dervish"] = 10] = "Dervish";
})(Profession = exports.Profession || (exports.Profession = {}));
var Attribute;
(function (Attribute) {
    Attribute[Attribute["FastCasting"] = 0] = "FastCasting";
    Attribute[Attribute["IllusionMagic"] = 1] = "IllusionMagic";
    Attribute[Attribute["DominationMagic"] = 2] = "DominationMagic";
    Attribute[Attribute["InspirationMagic"] = 3] = "InspirationMagic";
    Attribute[Attribute["BloodMagic"] = 4] = "BloodMagic";
    Attribute[Attribute["DeathMagic"] = 5] = "DeathMagic";
    Attribute[Attribute["SoulReaping"] = 6] = "SoulReaping";
    Attribute[Attribute["Curses"] = 7] = "Curses";
    Attribute[Attribute["AirMagic"] = 8] = "AirMagic";
    Attribute[Attribute["EarthMagic"] = 9] = "EarthMagic";
    Attribute[Attribute["FireMagic"] = 10] = "FireMagic";
    Attribute[Attribute["WaterMagic"] = 11] = "WaterMagic";
    Attribute[Attribute["EnergyStorage"] = 12] = "EnergyStorage";
    Attribute[Attribute["HealingPrayers"] = 13] = "HealingPrayers";
    Attribute[Attribute["SmitingPrayers"] = 14] = "SmitingPrayers";
    Attribute[Attribute["ProtectionPrayers"] = 15] = "ProtectionPrayers";
    Attribute[Attribute["DivineFavor"] = 16] = "DivineFavor";
    Attribute[Attribute["Strength"] = 17] = "Strength";
    Attribute[Attribute["AxeMastery"] = 18] = "AxeMastery";
    Attribute[Attribute["HammerMastery"] = 19] = "HammerMastery";
    Attribute[Attribute["Swordsmanship"] = 20] = "Swordsmanship";
    Attribute[Attribute["Tactics"] = 21] = "Tactics";
    Attribute[Attribute["BeastMastery"] = 22] = "BeastMastery";
    Attribute[Attribute["Expertise"] = 23] = "Expertise";
    Attribute[Attribute["WildernessSurvival"] = 24] = "WildernessSurvival";
    Attribute[Attribute["Marksmanship"] = 25] = "Marksmanship";
    Attribute[Attribute["DaggerMastery"] = 29] = "DaggerMastery";
    Attribute[Attribute["DeadlyArts"] = 30] = "DeadlyArts";
    Attribute[Attribute["ShadowArts"] = 31] = "ShadowArts";
    Attribute[Attribute["Communing"] = 32] = "Communing";
    Attribute[Attribute["RestorationMagic"] = 33] = "RestorationMagic";
    Attribute[Attribute["ChannelingMagic"] = 34] = "ChannelingMagic";
    Attribute[Attribute["CriticalStrikes"] = 35] = "CriticalStrikes";
    Attribute[Attribute["SpawningPower"] = 36] = "SpawningPower";
    Attribute[Attribute["SpearMastery"] = 37] = "SpearMastery";
    Attribute[Attribute["Command"] = 38] = "Command";
    Attribute[Attribute["Motivation"] = 39] = "Motivation";
    Attribute[Attribute["Leadership"] = 40] = "Leadership";
    Attribute[Attribute["ScytheMastery"] = 41] = "ScytheMastery";
    Attribute[Attribute["WindPrayers"] = 42] = "WindPrayers";
    Attribute[Attribute["EarthPrayers"] = 43] = "EarthPrayers";
    Attribute[Attribute["Mysticism"] = 44] = "Mysticism";
    Attribute[Attribute["NornRank"] = 214] = "NornRank";
    Attribute[Attribute["EbonVanguardRank"] = 215] = "EbonVanguardRank";
    Attribute[Attribute["DeldrimorRank"] = 216] = "DeldrimorRank";
    Attribute[Attribute["AsuraRank"] = 217] = "AsuraRank";
    Attribute[Attribute["LightbringerRank"] = 235] = "LightbringerRank";
    Attribute[Attribute["SunspearRank"] = 238] = "SunspearRank";
    Attribute[Attribute["LuxonRank"] = 249] = "LuxonRank";
    Attribute[Attribute["KurzickRank"] = 250] = "KurzickRank";
})(Attribute = exports.Attribute || (exports.Attribute = {}));
exports.ProfessionAbbreviation = {
    [Profession.None]: 'x',
    [Profession.Warrior]: 'W',
    [Profession.Ranger]: 'R',
    [Profession.Monk]: 'Mo',
    [Profession.Necromancer]: 'N',
    [Profession.Mesmer]: 'Me',
    [Profession.Elementalist]: 'E',
    [Profession.Assassin]: 'A',
    [Profession.Ritualist]: 'Rt',
    [Profession.Paragon]: 'P',
    [Profession.Dervish]: 'D',
};
exports.ProfessionNames = {
    [Profession.None]: 'None',
    [Profession.Warrior]: 'Warrior',
    [Profession.Ranger]: 'Ranger',
    [Profession.Monk]: 'Monk',
    [Profession.Necromancer]: 'Necromancer',
    [Profession.Mesmer]: 'Mesmer',
    [Profession.Elementalist]: 'Elementalist',
    [Profession.Assassin]: 'Assassin',
    [Profession.Ritualist]: 'Ritualist',
    [Profession.Paragon]: 'Paragon',
    [Profession.Dervish]: 'Dervish',
};
exports.AttributeNames = {
    [Attribute.FastCasting]: 'Fast Casting',
    [Attribute.IllusionMagic]: 'Illusion Magic',
    [Attribute.DominationMagic]: 'Domination Magic',
    [Attribute.InspirationMagic]: 'Inspiration Magic',
    [Attribute.BloodMagic]: 'Blood Magic',
    [Attribute.DeathMagic]: 'Death Magic',
    [Attribute.SoulReaping]: 'Soul Reaping',
    [Attribute.Curses]: 'Curses',
    [Attribute.AirMagic]: 'Air Magic',
    [Attribute.EarthMagic]: 'Earth Magic',
    [Attribute.FireMagic]: 'Fire Magic',
    [Attribute.WaterMagic]: 'Water Magic',
    [Attribute.EnergyStorage]: 'Energy Storage',
    [Attribute.HealingPrayers]: 'Healing Prayers',
    [Attribute.SmitingPrayers]: 'Smiting Prayers',
    [Attribute.ProtectionPrayers]: 'Protection Prayers',
    [Attribute.DivineFavor]: 'Divine Favor',
    [Attribute.Strength]: 'Strength',
    [Attribute.AxeMastery]: 'Axe Mastery',
    [Attribute.HammerMastery]: 'Hammer Mastery',
    [Attribute.Swordsmanship]: 'Swordsmanship',
    [Attribute.Tactics]: 'Tactics',
    [Attribute.BeastMastery]: 'Beast Mastery',
    [Attribute.Expertise]: 'Expertise',
    [Attribute.WildernessSurvival]: 'Wilderness Survival',
    [Attribute.Marksmanship]: 'Marksmanship',
    [Attribute.DaggerMastery]: 'Dagger Mastery',
    [Attribute.DeadlyArts]: 'Deadly Arts',
    [Attribute.ShadowArts]: 'Shadow Arts',
    [Attribute.Communing]: 'Communing',
    [Attribute.RestorationMagic]: 'Restoration Magic',
    [Attribute.ChannelingMagic]: 'Channeling Magic',
    [Attribute.CriticalStrikes]: 'Critical Strikes',
    [Attribute.SpawningPower]: 'Spawning Power',
    [Attribute.SpearMastery]: 'Spear Mastery',
    [Attribute.Command]: 'Command',
    [Attribute.Motivation]: 'Motivation',
    [Attribute.Leadership]: 'Leadership',
    [Attribute.ScytheMastery]: 'Scythe Mastery',
    [Attribute.WindPrayers]: 'Wind Prayers',
    [Attribute.EarthPrayers]: 'Earth Prayers',
    [Attribute.Mysticism]: 'Mysticism',
    [Attribute.NornRank]: 'Norn Rank',
    [Attribute.EbonVanguardRank]: 'Ebon Vanguard Rank',
    [Attribute.DeldrimorRank]: 'Deldrimor Rank',
    [Attribute.AsuraRank]: 'Asura Rank',
    [Attribute.LightbringerRank]: 'Lightbringer Rank',
    [Attribute.SunspearRank]: 'Sunspear Rank',
    [Attribute.LuxonRank]: 'Luxon Rank',
    [Attribute.KurzickRank]: 'Kurzick Rank',
};
const ASSETS_DIR = path_1.default.join(__dirname, '../assets');
const IMAGE_SIZE = 64;
const TEMPLATE_TYPE = 14;
const VERSION = 0;
const BASE_64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function getProfessionName(profession) {
    return exports.ProfessionNames[profession];
}
exports.getProfessionName = getProfessionName;
function getAttributeName(attribute) {
    return exports.AttributeNames[attribute];
}
exports.getAttributeName = getAttributeName;
function binpadright(s, n) {
    return s.padEnd(n, '0');
}
function valbin(v, n) {
    return binpadright(strrev(parseInt(v.toString()).toString(2)), n);
}
function binval(b) {
    return parseInt(strrev(b), 2);
}
function strrev(s) {
    return (s || '').split('').reverse().join('');
}
function charindex(c) {
    const n = BASE_64.length;
    for (let i = 0; i < n; i++)
        if (BASE_64.substr(i, 1) == c)
            return i;
    throw Error;
}
function codetobin(template) {
    const length = template.length;
    let binary = '';
    for (let i = 0; i < length; i++) {
        binary += valbin(charindex(template.substr(i, 1)).toString(), 6);
    }
    return binary;
}
function bintocode(bin) {
    const r = bin.length % 6;
    let c = '';
    if (r != 0)
        bin = binpadright(bin, bin.length + 6 - r);
    while (bin.length > 0) {
        c += BASE_64.substr(parseInt(strrev(bin.substr(0, 6)), 2), 1);
        bin = bin.substr(6);
    }
    return c;
}
function decodeTemplate(template) {
    const binary = codetobin(template);
    let offset = 0;
    const read = (bits) => {
        const out = binary.substr(offset, bits);
        offset += bits;
        return binval(out);
    };
    const templateType = read(4);
    if (templateType != TEMPLATE_TYPE) {
        return null;
    }
    const version = read(4);
    const professionBitLength = read(2) * 2 + 4;
    const primary = read(professionBitLength);
    const secondary = read(professionBitLength);
    const attributeCount = read(4);
    const attributeBitLength = read(4) + 4;
    const attributes = {};
    for (let i = 0; i < attributeCount; i++) {
        attributes[read(attributeBitLength)] = read(4);
    }
    const skillBitLength = read(4) + 8;
    const skills = new Array(8);
    for (let i = 0; i < 8; i++) {
        skills[i] = skillsMapById[read(skillBitLength)];
    }
    return {
        type: templateType,
        version,
        primary,
        secondary,
        attributes,
        skills,
        template,
    };
}
exports.decodeTemplate = decodeTemplate;
function encodeSkillbar(skillbar) {
    const type = valbin(skillbar.type, 4);
    const version = valbin(skillbar.version, 4);
    const professionBitLength = Math.max(4, valbin(skillbar.primary, 0).length, valbin(skillbar.secondary, 0).length);
    const primary = valbin(skillbar.primary, professionBitLength);
    const secondary = valbin(skillbar.secondary, professionBitLength);
    const attributeCount = valbin(Object.keys(skillbar.attributes).length, 4);
    const attributeBitLength = Math.max(4, ...Object.keys(skillbar.attributes).map((a) => valbin(a, 0).length));
    const attributes = Object.entries(skillbar.attributes).reduce((out, [attributeId, attributeLevel]) => {
        return [...out, valbin(attributeId, attributeBitLength), valbin(attributeLevel, 4)];
    }, []);
    const skillBitLength = Math.max(8, ...skillbar.skills.map((skillId) => valbin(skillId, 0).length));
    const skills = skillbar.skills.map((skillId) => valbin(skillId, skillBitLength));
    const template = [
        type,
        version,
        valbin(Math.max(Math.ceil((professionBitLength - 4) / 2), 0), 2),
        primary,
        secondary,
        attributeCount,
        valbin(Math.max(attributeBitLength - 4, 0), 4),
        ...attributes,
        valbin(Math.max(skillBitLength - 8, 0), 4),
        ...skills,
    ];
    return bintocode(template.join(''));
}
exports.encodeSkillbar = encodeSkillbar;
//# sourceMappingURL=skills.js.map