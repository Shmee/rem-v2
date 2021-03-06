/**
 * Created by Julian on 22.03.2017.
 */
let regex = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:(?:watch\?v=)?(?:[a-zA-Z0-9_-]+)(?:&.*)(?:&list=)([a-zA-Z0-9_-]+)(?:&.*|)|(?:playlist\?list=)?([a-zA-Z0-9_-]+))/;
let axios = require('axios');
let Song = require('../../structures/song');
let SongTypes = require('../../structures/constants').SONG_TYPES;
let ytr = require('./youtubeResolver');
class YoutubePlaylistResolver {
    constructor() {

    }

    canResolve(url) {
        return regex.test(url);
    }

    async resolve(url) {
        let id = this.getIdFromLink(url);
        if (!id) {
            throw new Error('failed to fetch id from url provided.');
        }
        let res = await axios.get(`https://www.youtube.com/list_ajax?style=json&action_get_list=1&list=${id}`);
        if (!res.data || !res.data.video) {
            throw new Error(`This id (${id}) seems bad.`);
        }
        let playlist = {title: res.data.title, author: res.data.author, songs: []};
        let songs = [];
        for (let i = 0; i < res.data.video.length; i++) {
            let video = res.data.video[i];
            let song = new Song({
                id: video.encrypted_id,
                type: SongTypes.youtube,
                duration: video.duration,
                url: `https://www.youtube.com/watch?v=${video.encrypted_id}`,
                needsResolve: true,
                title: video.title,
                local: false
            });
            songs.push(song);
        }
        songs[0] = await ytr.resolve(songs[0].url);
        playlist.songs = songs;
        return Promise.resolve(playlist);
    }

    getIdFromLink(url) {
        let m;
        m = regex.exec(url);
        for (let i = 0; i < m.length; i++) {
            if (typeof m[i] !== 'undefined' && m[i] !== url) {
                return m[i];
            }
        }
    }
}
module.exports = new YoutubePlaylistResolver();
