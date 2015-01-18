/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012 Loic J. Duros
 * Copyright (C) 2014, 2015 Nik Nyby
 *
 * This file is part of GNU LibreJS.
 *
 * GNU LibreJS is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * GNU LibreJS is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GNU LibreJS.  If not, see <http://www.gnu.org/licenses/>.
 */

var linkTypes = {

  // constants. Also available in lib/ui_info.js
  'CERTAIN_EMAIL_ADDRESS_FOUND': 'certainEmailAddressFound',
  'UNCERTAIN_EMAIL_ADDRESS_FOUND': 'uncertainEmailAddressFound',

  // Looking for contact links
  'CERTAIN_LINK_FOUND': 'certainLinkFound',
  'PROBABLE_LINK_FOUND': 'probableLinkFound',
  'UNCERTAIN_LINK_FOUND': 'uncertainLinkFound',
  'LINK_NOT_FOUND': 'contactLinkNotFound',

  // Looking for identi.ca and twitter accounts.
  'TWITTER_LINK_FOUND': 'twitterLinkFound',
  'IDENTICA_LINK_FOUND': 'identicaLinkFound',

  // phone number and address
  'PHONE_NUMBER_FOUND': 'phoneNumberFound',
  'SNAIL_ADDRESS_FOUND': 'snailAddressFound'

};    

