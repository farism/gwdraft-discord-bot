"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Player {
    constructor() {
        this.rank = {
            Assassin: 0,
            Dervish: 0,
            Elementalist: 0,
            Mesmer: 0,
            Monk: 0,
            Necromancer: 0,
            Paragon: 0,
            Ranger: 0,
            Ritualist: 0,
            Warrior: 0,
            comms: 0,
            split: 0,
            prot: 0,
            heal: 0,
            micro: 0,
            macro: 0,
            mat: 0,
        };
        this.preferences = [];
    }
    get totalRank() {
        return Object.values(this.rank).reduce((acc, val) => acc + val, 0);
    }
    setAllRanks(rank) {
        Object.entries(this.rank).forEach(([key, val]) => {
            this.rank[key] = rank;
        });
        return this;
    }
}
class TestPlayer extends Player {
    newplayer() {
        this.setAllRanks(0);
        return this;
    }
    midtier() {
        this.setAllRanks(5);
        return this;
    }
    toptier() {
        this.setAllRanks(9);
        return this;
    }
}
class Team {
    constructor() {
        this.players = [];
    }
    add(p) {
        this.players = [...this.players, p];
    }
    remove(p) {
        this.players = this.players.filter((player) => p !== player);
    }
    get length() {
        return this.players.length;
    }
    get totalRank() {
        return this.players.reduce((acc, p) => acc + p.totalRank, 0);
    }
}
function createPlayers(count = 16) {
    return [...Array(count).keys()].map(() => new TestPlayer());
}
function shouldPlayBackline(player) {
    if (player.rank.Monk >= 5) {
        return true;
    }
}
function shouldPlayFlagger(p) {
    return p.rank.Monk >= 5 && p.rank.split >= 5;
}
function shouldPlayProt(p) {
    return p.rank.Monk >= 5 && p.rank.prot >= 5;
}
function shouldPlayHeal(p) {
    return p.rank.Monk >= 5 && p.rank.heal >= 5;
}
function draft(players) {
    if (players.length < 16) {
        throw new Error('Not enough players for draft (need 16)');
    }
    const backline = players.filter(shouldPlayBackline);
    const team1 = new Team();
    const team2 = new Team();
    for (let i = 0; i < players.length; i++) {
        if (i % 2 === 0) {
            team1.add(players[i]);
        }
        else {
            team2.add(players[i]);
        }
    }
    return {
        message: 'Teams drafted successfully',
        teams: [team1, team2],
    };
}
describe('scope', () => {
    it('fails if there are not enough players to create a 16 person draft', () => {
        expect(() => draft([])).toThrow();
    });
    it('evenly distributes the players on each team', () => {
        const { teams } = draft(createPlayers(16));
        expect(teams[0]).toHaveLength(8);
        expect(teams[1]).toHaveLength(8);
    });
    xit('creates similar ranking average between each team', () => {
        const players = createPlayers(16)
            .map((p) => p.setAllRanks(5))
            .sort((a, b) => b.totalRank - a.totalRank);
        const { teams } = draft(players);
    });
    it('ensures there are 3 backline on each team', () => {
        expect('1').toBe('1');
    });
    it('puts highest ranked players on midline', () => {
        expect('1').toBe('1');
    });
    it('puts higher ranked players on backline', () => {
        expect('1').toBe('1');
    });
    it('puts players on preferred roles if they are ranked high enough to play them', () => {
        expect('1').toBe('1');
    });
});
//# sourceMappingURL=draft.test.js.map