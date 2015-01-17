/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2014 Loic J. Duros
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see  <http://www.gnu.org/licenses/>.
 *
 */
// email address regexp
var reEmail = /^mailto\:(admin|feedback|webmaster|info|contact|support|comments|team|help)\@[a-z0-9.\-]+\.[a-z]{2,4}$/i;

var reAnyEmail = /^mailto\:.*?\@[a-z0-9\.\-]+\.[a-z]{2,4}$/i;

// twitter address regexp
var reTwitter = /twitter\.com\/(\!?#\/)?[a-z0-9]*/i;

// identi.ca address regexp
var reIdentiCa = /identi\.ca\/(?!notice\/)[a-z0-9]*/i;

/**
 * contactSearchStrings
 * Contains arrays of strings classified by language
 * and by degree of certainty.
 */
var contactStr = {
    'da': {
        'certain': [
            '^[\\s]*Kontakt os[\\s]*$',
            '^[\\s]*Email Os[\\s]*$',
            '^[\\s]*Kontakt[\\s]*$'
        ],
        'probable': ['^[\\s]Kontakt', '^[\\s]*Email'],
        'uncertain': [
            '^[\\s]*Om Us',
            '^[\\s]*Om',
            'Hvem vi er'
        ]
    },
    'en': {
        'certain': [
            '^[\\s]*Contact Us[\\s]*$',
            '^[\\s]*Email Us[\\s]*$',
            '^[\\s]*Contact[\\s]*$',
            '^[\\s]*Feedback[\\s]*$',
            '^[\\s]*Web.?site Feedback[\\s]*$'
        ],
        'probable': ['^[\\s]Contact', '^[\\s]*Email'],
        'uncertain': [
            '^[\\s]*About Us',
            '^[\\s]*About',
            'Who we are',
            'Who I am',
            'Company Info',
            'Customer Service'
        ]
    },
    'es': {
        'certain': [
            '^[\\s]*contáctenos[\\s]*$',
            '^[\\s]*Email[\\s]*$'
        ],
        'probable': ['^[\\s]contáctenos', '^[\\s]*Email'],
        'uncertain': [
            'Acerca de nosotros'
        ]
    },
    'fr': {
        'certain': [
            '^[\\s]*Contactez nous[\\s]*$',
            '^[\\s]*(Nous )?contacter[\\s]*$',
            '^[\\s]*Email[\\s]*$',
            '^[\\s]*Contact[\\s]*$',
            '^[\\s]*Commentaires[\\s]*$'
        ],
        'probable': ['^[\\s]Contact', '^[\\s]*Email'],
        'uncertain': [
            '^[\\s]*(A|À) propos',
            'Qui nous sommes',
            'Qui suis(-| )?je',
            'Info',
            'Service Client(e|è)le'
        ]
    }
};

var usaPhoneNumber =
    /(?:\+ ?1 ?)?\(?[2-9]{1}[0-9]{2}\)?(?:\-|\.| )?[0-9]{3}(?:\-|\.| )[0-9]{4}(?:[^0-9])/mg;
