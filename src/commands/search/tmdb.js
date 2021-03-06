/*
 *   This file is part of discord-self-bot
 *   Copyright (C) 2017-2018 Favna
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, version 3 of the License
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *   Additional Terms 7.b and 7.c of GPLv3 apply to this file:
 *       * Requiring preservation of specified reasonable legal notices or
 *         author attributions in that material or in the Appropriate Legal
 *         Notices displayed by works containing it.
 *       * Prohibiting misrepresentation of the origin of that material,
 *         or requiring that modified versions of such material be marked in
 *         reasonable ways as different from the original version.
 */

const Discord = require('discord.js'),
	commando = require('discord.js-commando'),
	moment = require('moment'),
	request = require('snekfetch'),
	{TheMovieDBV3ApiKey} = require('../../auth.json'),
	{deleteCommandMessages} = require('../../util.js');

module.exports = class movieCommand extends commando.Command {
	constructor (client) {
		super(client, {
			'name': 'tmdb',
			'memberName': 'tmdb',
			'group': 'search',
			'aliases': ['movie'],
			'description': 'Finds movies and TV shows on TheMovieDB',
			'format': 'MovieName [release_year_movie]',
			'examples': ['tmdb Ocean\'s Eleven 2001'],
			'guildOnly': false,
			'args': [
				{
					'key': 'name',
					'prompt': 'What movie do you want to find?',
					'type': 'string'
				}
			]
		});
	}

	async run (msg, args) {
		const embed = new Discord.MessageEmbed(),
			search = await request.get('https://api.themoviedb.org/3/search/movie')
				.query('api_key', TheMovieDBV3ApiKey)
				.query('query', args.name)
				.query('include_adult', false);

		if (search.ok && search.body.total_results > 0) {
			const details = await request.get(`https://api.themoviedb.org/3/movie/${search.body.results[0].id}`)
				.query('api_key', TheMovieDBV3ApiKey);

			if (details.ok) {
				const movie = details.body;

				embed
					.setTitle(movie.title)
					.setURL(`https://www.themoviedb.org/movie/${movie.id}`)
					.setColor(msg.guild ? msg.member.displayHexColor : '#FF0000')
					.setImage(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
					.setThumbnail(`https://image.tmdb.org/t/p/original${movie.poster_path}`)
					.setDescription(movie.overview)
					.addField('Runtime', `${movie.runtime} minutes`, true)
					.addField('User Score', movie.vote_average, true)
					.addField('Status', movie.status, true)
					.addField('Release Date', moment(movie.release_date).format('MMMM Do YYYY'), true)
					.addField('Collection', movie.belongs_to_collection !== null ? movie.belongs_to_collection.name : 'none', true)
					.addField('IMDB Page', movie.imdb_id_id !== '' ? `[Click Here](http://www.imdb.com/title/${movie.imdb_id})` : 'none', true)
					.addField('Genres', movie.genres.length !== 0 ? movie.genres.map(genre => genre.name).join(', ') : 'None on TheMovieDB')
					.addField('Production Companies', movie.production_companies.length !== 0 ? movie.production_companies.map(company => company.name).join(', ') : 'None on TheMovieDB');

				deleteCommandMessages(msg, this.client);

				return msg.embed(embed);
			}

			deleteCommandMessages(msg, this.client);
			
			return msg.reply(`***Failed to fetch details for \`${args.name}\`***`);
		}

		deleteCommandMessages(msg, this.client);

		return msg.reply(`***No movies found for \`${args.name}\`***`);
	}
};