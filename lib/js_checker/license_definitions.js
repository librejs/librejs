/**
 * GNU LibreJS - A browser add-on to block nonfree nontrivial JavaScript.
 * *
 * Copyright (C) 2011, 2012, 2013, 2014 Loic J. Duros
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
exports.types = {
    SHORT: 'short',
    LAZY: 'lazy',
    FULL: 'full'
};

var type = exports.types;

/**
 * List of all the licenses.
 * Currently only short substrings are used with regex.
 *
 * The licenses are indexed by their "Identifier", which, when possible,
 * corresponds to their identifier as specified by SPDX here:
 *   https://spdx.org/licenses/
 */
exports.licenses = {
    'CC0-1.0': {
        licenseName: 'Creative Commons CC0 1.0 Universal',
        identifier: 'CC0-1.0',
        canonicalUrl: [
            'http://creativecommons.org/publicdomain/zero/1.0/legalcode',
            'magnet:?xt=urn:btih:90dc5c0be029de84e523b9b3922520e79e0e6f08&dn=cc0.txt'
        ],
        licenseFragments: []
    },


    'GPL-2.0': {
        licenseName: 'GNU General Public License (GPL) version 2',
        identifier: 'GPL-2.0',
        canonicalUrl: [
            'http://www.gnu.org/licenses/gpl-2.0.html',
            'magnet:?xt=urn:btih:cf05388f2679ee054f2beb29a391d25f4e673ac3&dn=gpl-2.0.txt'
        ],
        licenseFragments: [{text: "<THISPROGRAM> is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.", type: type.SHORT},
        {text:"Alternatively, the contents of this file may be used under the terms of either the GNU General Public License Version 2 or later (the \"GPL\"), or the GNU Lesser General Public License Version 2.1 or later (the \"LGPL\"), in which case the provisions of the GPL or the LGPL are applicable instead of those above. If you wish to allow use of your version of this file only under the terms of either the GPL or the LGPL, and not to allow others to use your version of this file under the terms of the MPL, indicate your decision by deleting the provisions above and replace them with the notice and other provisions required by the GPL or the LGPL. If you do not delete the provisions above, a recipient may use your version of this file under the terms of any one of the MPL, the GPL or the LGPL.", type: type.SHORT}]
    },

    'GPL-3.0': {
        licenseName: 'GNU General Public License (GPL) version 3',
        identifier: 'GPL-3.0',
        canonicalUrl: [
            'http://www.gnu.org/licenses/gpl-3.0.html',
            'magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt'
        ],
        licenseFragments: [
        {text: "The JavaScript code in this page is free software: you can redistribute it and/or modify it under the terms of the GNU  General Public License (GNU GPL) as published by the Free Software  Foundation, either version 3 of the License, or (at your option)  any later version. The code is distributed WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU GPL for more details. As additional permission under GNU GPL version 3 section 7, you may distribute non-source (e.g., minimized or compacted) forms of that code without the copy of the GNU GPL normally required by section 4, provided you include this license notice and a URL through which recipients can access the Corresponding Source.", type: type.SHORT},
        {text: "<THISPROGRAM> is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.", type: type.SHORT}]
    },

    'GNU-All-Permissive': {
        licenseName: 'GNU All-Permissive License',
        licenseFragments: [{text: "Copying and distribution of this file, with or without modification, are permitted in any medium without royalty provided the copyright notice and this notice are preserved. This file is offered as-is, without any warranty.", type: type.SHORT}]
    },

    'Apache-2.0': {
        licenseName: 'Apache License, Version 2.0',
        identifier: 'Apache-2.0',
        canonicalUrl: [
            'http://www.apache.org/licenses/LICENSE-2.0',
            'magnet:?xt=urn:btih:8e4f440f4c65981c5bf93c76d35135ba5064d8b7&dn=apache-2.0.txt'
        ],
        licenseFragments: [{text: "Licensed under the Apache License, Version 2.0 (the \"License\"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0", type: type.SHORT}]
    },

    'LGPL-2.1': {
        licenseName: 'GNU Lesser General Public License, version 2.1',
        identifier: 'LGPL-2.1',
        canonicalUrl: [
            'http://www.gnu.org/licenses/lgpl-2.1.html',
            'magnet:?xt=urn:btih:5de60da917303dbfad4f93fb1b985ced5a89eac2&dn=lgpl-2.1.txt'
        ],
        licenseFragments: [{text: "<THISLIBRARY> is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option) any later version.", type: type.SHORT}]
    },

    'LGPL-3.0': {
        licenseName: 'GNU Lesser General Public License, version 3',
        identifier: 'LGPL-3.0',
        canonicalUrl: [
            'http://www.gnu.org/licenses/lgpl-3.0.html',
            'magnet:?xt=urn:btih:0ef1b8170b3b615170ff270def6427c317705f85&dn=lgpl-3.0.txt'
        ],
        licenseFragments: [{text: "<THISPROGRAM> is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.", type: type.SHORT}]
    },

    'AGPL-3.0': {
        licenseName: 'GNU AFFERO GENERAL PUBLIC LICENSE version 3',
        identifier: 'AGPL-3.0',
        canonicalUrl: [
            'http://www.gnu.org/licenses/agpl-3.0.html',
            'magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt'
        ],

        licenseFragments: [{text: "<THISPROGRAM> is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.", type: type.SHORT}]
    },

    'BSL-1.0': {
        licenseName: 'Boost Software License 1.0',
        identifier: 'BSL-1.0',
        canonicalUrl: [
            'http://www.boost.org/LICENSE_1_0.txt',
            'magnet:?xt=urn:btih:89a97c535628232f2f3888c2b7b8ffd4c078cec0&dn=Boost-1.0.txt'
        ],
        licenseFragments: [{text: "Boost Software License <VERSION> <DATE> Permission is hereby granted, free of charge, to any person or organization obtaining a copy of the software and accompanying documentation covered by this license (the \"Software\") to use, reproduce, display, distribute, execute, and transmit the Software, and to prepare derivative works of the Software, and to permit third-parties to whom the Software is furnished to do so, all subject to the following", type: type.SHORT}]
    },

    'BSD-3-Clause': {
        licenseName: "BSD 3-Clause License",
        identifier: 'BSD-3-Clause',
        canonicalUrl: [
            'http://opensource.org/licenses/BSD-3-Clause',
            'magnet:?xt=urn:btih:c80d50af7d3db9be66a4d0a86db0286e4fd33292&dn=bsd-3-clause.txt'
        ],
        licenseFragments: [{text: "Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution. Neither the name of <ORGANIZATION> nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.", type: type.SHORT}]
    },

    'BSD-2-Clause': {
        licenseName: "BSD 2-Clause License",
        identifier: 'BSD-2-Clause',
        licenseFragments: [{text: "Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.", type: type.SHORT}]
    },

    'EPL-1.0': {
	    licenseName: "Eclipse Public License Version 1.0",
	    identifier: "EPL-1.0",
	    canonicalUrl: [
	        "http://www.eclipse.org/legal/epl-v10.html",
	        "magnet:?xt=urn:btih:4c6a2ad0018cd461e9b0fc44e1b340d2c1828b22&dn=epl-1.0.txt"
	    ],
	    licenseFragments: [
	        {
		        text: "THE ACCOMPANYING PROGRAM IS PROVIDED UNDER THE TERMS OF THIS ECLIPSE PUBLIC LICENSE (\"AGREEMENT\"). ANY USE, REPRODUCTION OR DISTRIBUTION OF THE PROGRAM CONSTITUTES RECIPIENT'S ACCEPTANCE OF THIS AGREEMENT.",
		        type: type.SHORT
	        }
	    ]
    },

    'MPL-2.0': {
        licenseName: 'Mozilla Public License Version 2.0',
        identifier: 'MPL-2.0',
        canonicalUrl: [
            'http://www.mozilla.org/MPL/2.0',
            'magnet:?xt=urn:btih:3877d6d54b3accd4bc32f8a48bf32ebc0901502a&dn=mpl-2.0.txt'
        ],
        licenseFragments: [{text: "This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.", type: type.SHORT }]
    },

    'Expat': {
        licenseName: 'Expat License (sometimes called MIT Licensed)',
        identifier: 'Expat',
        canonicalUrl: [
            'http://www.jclark.com/xml/copying.txt',
            'magnet:?xt=urn:btih:d3d9a9a6595521f9666a5e94cc830dab83b65699&dn=expat.txt'
        ],
        licenseFragments: [{text: "Copyright <YEAR> <NAME> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.", type: type.SHORT}]
    },

    'UPL': {
        licenseName: 'Universal Permissive License',
        identifier: 'UPL-1.0',
        canonicalUrl: [
            'magnet:?xt=urn:btih:5305d91886084f776adcf57509a648432709a7c7&dn=x11.txt'
        ],
        licenseFragments: [{
            text: "The Universal Permissive License (UPL), Version 1.0",
            type: type.SHORT
        }]
    },

    'X11': {
        licenseName: 'X11 License',
        identifier: 'X11',
        canonicalUrl: [
            'magnet:?xt=urn:btih:5305d91886084f776adcf57509a648432709a7c7&dn=x11.txt'
        ],
        licenseFragments: [{text: "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.", type: type.SHORT}]
    },

    'XFree86-1.1': {
        licenseName: "XFree86 1.1 License",
        identifier: 'XFree86-1.1',
        canonicalUrl: [
            'http://www.xfree86.org/3.3.6/COPYRIGHT2.html#3',
            'http://www.xfree86.org/current/LICENSE4.html',
            'magnet:?xt=urn:btih:12f2ec9e8de2a3b0002a33d518d6010cc8ab2ae9&dn=xfree86.txt'
        ],
        licenseFragments: [{text: "All rights reserved.\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n1. Redistributions of source code must retain the above copyright notice, this list of conditions, and the following disclaimer.\n2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution, and in the same place and form as other copyright, license and disclaimer information.\n3. The end-user documentation included with the redistribution, if any, must include the following acknowledgment: \"This product includes software developed by The XFree86 Project, Inc (http://www.xfree86.org/) and its contributors\", in the same place and form as other third-party acknowledgments. Alternately, this acknowledgment may appear in the software itself, in the same form and location as other such third-party acknowledgments.4. Except as contained in this notice, the name of The XFree86 Project, Inc shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from The XFree86 Project, Inc.", type: type.SHORT}
        ]
    },

    'FreeBSD': {
        licenseName: "FreeBSD License",
        identifier: 'FreeBSD',
        canonicalUrl: [
            'http://www.freebsd.org/copyright/freebsd-license.html',
            'magnet:?xt=urn:btih:87f119ba0b429ba17a44b4bffcab33165ebdacc0&dn=freebsd.txt'
        ],
        licenseFragments: [{text: "Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\nRedistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\nRedistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.", type: type.SHORT}]
    },

    'ISC': {
        licenseName: "The ISC License",
        identifier: 'ISC',
        canonicalUrl: [
            'https://www.isc.org/downloads/software-support-policy/isc-license/',
            'magnet:?xt=urn:btih:b8999bbaf509c08d127678643c515b9ab0836bae&dn=ISC.txt'
        ],
        licenseFragments: [{text: "Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.", type: type.SHORT},
        {text: "Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.THE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.", type: type.SHORT}]
    },

    'jQueryTools': {
        licenseName: "jQuery Tools",
        licenseFragments: [{
            text: 'NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.',
            type: type.SHORT
        }]
    },

    'Artistic-2.0': {
        licenseName: "Artistic License 2.0",
        identifier: 'Artistic-2.0',
        canonicalUrl: [
            "http://www.perlfoundation.org/artistic_license_2_0",
            "magnet:?xt=urn:btih:54fd2283f9dbdf29466d2df1a98bf8f65cafe314&dn=artistic-2.0.txt"
        ],
        licenseFragments: []
    },

    'PublicDomain': {
        licenseName: "Public Domain",
        canonicalUrl: [
            'magnet:?xt=urn:btih:e95b018ef3580986a04669f1b5879592219e2a7a&dn=public-domain.txt'
        ],
        licenseFragments: []
    },

    'CPAL-1.0': {
        licenseName: 'Common Public Attribution License Version 1.0 (CPAL)',
        identifier: 'CPAL-1.0',
        canonicalUrl: [
            'http://opensource.org/licenses/cpal_1.0',
            'magnet:?xt=urn:btih:84143bc45939fc8fa42921d619a95462c2031c5c&dn=cpal-1.0.txt'
        ],
        licenseFragments: [
            {
                text: 'The contents of this file are subject to the Common Public Attribution License Version 1.0',
                type: type.SHORT
            },
            {
                text: 'The term "External Deployment" means the use, distribution, or communication of the Original Code or Modifications in any way such that the Original Code or Modifications may be used by anyone other than You, whether those works are distributed or communicated to those persons or made available as an application intended for use over a network. As an express condition for the grants of license hereunder, You must treat any External Deployment by You of the Original Code or Modifications as a distribution under section 3.1 and make Source Code available under Section 3.2.',
                type: type.SHORT
            }
        ]
    },
    'WTFPL': {
        licenseName: 'Do What The F*ck You Want To Public License (WTFPL)',
        identifier: 'WTFPL',
        canonicalUrl: [
            'http://www.wtfpl.net/txt/copying/',
            'magnet:?xt=urn:btih:723febf9f6185544f57f0660a41489c7d6b4931b&dn=wtfpl.txt'
        ],
        licenseFragments: [
            {
                text: 'DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE',
                type: type.SHORT
            },
            {
                text: '0. You just DO WHAT THE FUCK YOU WANT TO.',
                type: type.SHORT
            }
        ]
    },
    'Unlicense': {
        licenseName: 'Unlicense',
        identifier: 'Unlicense',
        canonicalUrl: [
            'http://unlicense.org/UNLICENSE',
            'magnet:?xt=urn:btih:5ac446d35272cc2e4e85e4325b146d0b7ca8f50c&dn=unlicense.txt'
        ],
        licenseFragments: [
            {
                text: 'This is free and unencumbered software released into the public domain.',
                type: type.SHORT
            },
        ]
    }
};
