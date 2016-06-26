module.exports = {

	boot: {
		body: {
			urlencoded: {
				extended: true,
				limit: '16mb'
			},
			json: {
				limit: '16mb'
			}
		},
		compress: {},
		cookie: {},
		favicon: {
			fileName: 'favicon.ico'
		},
		forward: {
			'project domain': 'project route prefix'
		},
		mailer: {
			'<%= appSlug %>': {
				service: 'Mailgun',
				auth: {
					user: 'Mailgun user',
					pass: 'Mailgun pass'
				},
				socketTimeout: 60000
			}
		},
		oauthproxy: {
			'api key': 'api secret'
		},
		session: {
			name: '<%= appSlug %>.sid',
			secret: '<%= sessionSecret %>',
			cookie: {
				maxAge: 604800000
			},
			resave: false,
			saveUninitialized: true
		},
		'static': {
			dir: 'public',
			options: {
				maxAge: '1d'
			}
		},
		timezone: {
			'default': 'UTC' // Europe/Istanbul
		},
		view: {
			dir: 'view',
			swig: {
				cache: 'memory'
			}
		}
	},

	middle: {
		basic: {
			enabled: true,
			user: '<%= appSlug %>',
			pass: '<%= basicSecret %>'
		}
	},

	admin: {
		name: '<%= appName %>',
		logo: '<%= appSlug %>'
	},

	api: {
		query: {
			lean: true
		},
		token: {
			secret: '<%= tokenSecret %>',
			expires: 60
		},
		admin: {
			user: {
				name: 'Super Admin',
				email: 'super@admin.com',
				password: '<%= adminPass %>',
				type: 'A'
			}
		}
	},

	apps: {
		list: [
			{name: 'System', slug: 'system', long: 'System'},
			{name: '<%= appName %>', slug: '<%= appSlug %>', long: '<%= appDesc %>'}
		]
	},

	auth: {
		'<%= appSlug %>': {
			'/api/login': false,
			'/api/token': false,
			'/api/forgot': false,
			'/api/invite': false,
			'/api/invite/:token': false,
			'/api/register': false,
			'/api/resend': false,
			'/api/change_password': false,
			'/api/social': false,
			'/api/waiting/accept': false,
			'/api/waiting/decline': false,
			'/api/waiting/line': false,

			register: {
				// username: 'required|min:2|max:20|alpha_num',
				password: 'required|min:4|max:20',
				no_email_verify: true
			},
			auth: {
				invite_moderation: false,
				invite_expires: 7,
				waiting_list: false
			}
		}
	},

	data: {
		db: {
			enabled: false,
			uri: 'mysql url'
		},
		elasticsearch: {
			enabled: false,
			host: 'localhost',
			port: 9200,
			// auth: 'admin:admin',
			log: 'debug'
		},
		mongo: {
			host: '127.0.0.1',
			port: 27017,
			db: '<%= appSlug %>',
			user: '<%= appSlug %>',
			pass: '<%= mongoPass %>',
			pool: 10,
			autoIndex: true,
			debug: true
		},
		redis: {
			host: '127.0.0.1',
			port: 6379,
			pass: '<%= redisPass %>'
		},
		solr: {
			enabled: false,
			host: 'localhost',
			port: 8983,
			core: 'solrcore'
		}
	},

	feed: {
		enabled: false,
		cron: {
			interval: "0 * * * * *"
		},
		readability: false
	},

	locations: {
		base: 'data'
	},

	logger: {
		transport: 'Console',
		options: {
			level: 'debug',
			humanReadableUnhandledException: true,
			handleExceptions: true,
			json: false,
			colorize: false,
			prettyPrint: false,
			showLevel: false,
			timestamp: false
		}
	},

	resize: {
		'appdomain': [
			'resize options'
		]
	},

	social: {
		'<%= appSlug %>': {
			facebook: {
				enable: false,
				app: 'App Name',
				key: 'api key',
				secret: 'api secret',
				callback: "http://localhost/api/<%= appSlug %>/facebook/callback",
				success: "/success-url",
				failure: "/failure-url"
			},
			twitter: {
				enable: false,
				app: 'App Name',
				key: 'api key',
				secret: 'api secret',
				callback: 'http://localhost/api/<%= appSlug %>/twitter/callback',
				success: '/success-url',
				failure: '/failure-url'
			},
			instagram: {
				enable: false,
				app: 'App Name',
				key: 'api key',
				secret: 'api secret',
				callback: 'http://localhost/api/<%= appSlug %>/instagram/callback',
				success: '/success-url',
				failure: '/failure-url'
			},
			foursquare: {
				enable: false,
				app: 'App Name',
				key: "api key",
				secret: "api secret",
				callback: "http://localhost/api/<%= appSlug %>/foursquare/callback",
				success: '/success-url',
				failure: '/failure-url'
			}
		}
	},

	upload: {
		type: 's3',
		dir: 'public/upload',
		account: {
			key: 's3 key',
			secret: 's3 secret'
		},
		bucket: 's3 bucket',
		folder: 's3 folder'
	},

	sync: {
		data: {
			apps: true,
			roles: true,
			objects: true,
			superadmin: true,
			actions: true,
			userroles: false,
			docs: false,
			superacl: true,
			core: true
		},
		random: {
			model_name: false
		},
		denormalize: {
			model_name: false
		},
		index: {
			system_locations: false,
			model_name: false
		},
		locations: {
			autoindex: false
		},
        fill_users_apps: {
            'model.name': false
        }
	},

	roles: {
		system: {
			'default': [
				{name: 'Superadmin', slug: 'superadmin'}
			]
		},
		'<%= appSlug %>': {
			'default': [
				{name: 'Admin', slug: 'admin'},
                {name: 'User', slug: 'user'},
                {name: 'Guest', slug: 'guest'}
			],
            initial: {
                register: 'user'
            },
			actions: {
				admin: {}
			}
		}
	},

	mail: {
		'<%= appSlug %>': {
			baseUrl: 'http://baseurl/',
			domains: [],
			endpoints: {
				reset: 'reset',
				invite: 'invite',
				register: 'verify'
			},
			reset: {
				from: 'App Name <app@app.com>',
				subject: 'Reset Password'
			},
			invite: {
				from: 'App Name <app@app.com>',
				subject: 'App Invitation'
			},
			register: {
				from: 'App Name <app@app.com>',
				subject: 'App Register'
			},
			'waiting/accept': {
				from: 'App Name <app@app.com>',
				subject: 'Account Accepted'
			},
			'waiting/decline': {
				from: 'App Name <app@app.com>',
				subject: 'Account Declined'
			}
		}
	},

	stopwords: {
		tr: ['acaba', 'acep', 'adeta', 'altmýþ', 'altmış', 'altý', 'altı', 'ama', 'ancak', 'arada', 'artýk', 'aslında', 'aynen', 'ayrıca', 'az', 'bana', 'bari', 'bazen', 'bazý', 'bazı', 'baţka', 'belki', 'ben', 'benden', 'beni', 'benim', 'beri', 'beþ', 'beş', 'beţ', 'bile', 'bin', 'bir', 'biraz', 'biri', 'birkaç', 'birkez', 'birçok', 'birþey', 'birþeyi', 'birşey', 'birşeyi', 'birţey', 'biz', 'bizden', 'bize', 'bizi', 'bizim', 'bu', 'buna', 'bunda', 'bundan', 'bunlar', 'bunları', 'bunların', 'bunu', 'bunun', 'burada', 'böyle', 'böylece', 'bütün', 'da', 'daha', 'dahi', 'dahil', 'daima', 'dair', 'dayanarak', 'de', 'defa', 'deđil', 'değil', 'diye', 'diđer', 'diğer', 'doksan', 'dokuz', 'dolayı', 'dolayısıyla', 'dört', 'edecek', 'eden', 'ederek', 'edilecek', 'ediliyor', 'edilmesi', 'ediyor', 'elli', 'en', 'etmesi', 'etti', 'ettiği', 'ettiğini', 'eđer', 'eğer', 'fakat', 'gibi', 'göre', 'halbuki', 'halen', 'hangi', 'hani', 'hariç', 'hatta', 'hele', 'hem', 'henüz', 'hep', 'hepsi', 'her', 'herhangi', 'herkes', 'herkesin', 'hiç', 'hiçbir', 'iken', 'iki', 'ila', 'ile', 'ilgili', 'ilk', 'illa', 'ise', 'itibaren', 'itibariyle', 'iyi', 'iyice', 'için', 'işte', 'iţte', 'kadar', 'kanýmca', 'karşın', 'katrilyon', 'kendi', 'kendilerine', 'kendini', 'kendisi', 'kendisine', 'kendisini', 'kere', 'kez', 'keţke', 'ki', 'kim', 'kimden', 'kime', 'kimi', 'kimse', 'kýrk', 'kýsaca', 'kırk', 'lakin', 'madem', 'međer', 'milyar', 'milyon', 'mu', 'mü', 'mý', 'mı', 'nasýl', 'nasıl', 'ne', 'neden', 'nedenle', 'nerde', 'nere', 'nerede', 'nereye', 'nitekim', 'niye', 'niçin', 'o', 'olan', 'olarak', 'oldu', 'olduklarını', 'olduğu', 'olduğunu', 'olmadı', 'olmadığı', 'olmak', 'olması', 'olmayan', 'olmaz', 'olsa', 'olsun', 'olup', 'olur', 'olursa', 'oluyor', 'on', 'ona', 'ondan', 'onlar', 'onlardan', 'onlari', 'onlarýn', 'onları', 'onların', 'onu', 'onun', 'otuz', 'oysa', 'pek', 'rağmen', 'sadece', 'sanki', 'sekiz', 'seksen', 'sen', 'senden', 'seni', 'senin', 'siz', 'sizden', 'sizi', 'sizin', 'sonra', 'tarafından', 'trilyon', 'tüm', 'var', 'vardı', 've', 'veya', 'veyahut', 'ya', 'yahut', 'yani', 'yapacak', 'yapmak', 'yaptı', 'yaptıkları', 'yaptığı', 'yaptığını', 'yapılan', 'yapılması', 'yapıyor', 'yedi', 'yerine', 'yetmiþ', 'yetmiş', 'yetmiţ', 'yine', 'yirmi', 'yoksa', 'yüz', 'zaten', 'çok', 'çünkü', 'öyle', 'üzere', 'üç', 'þey', 'þeyden', 'þeyi', 'þeyler', 'þu', 'þuna', 'þunda', 'þundan', 'þunu', 'şey', 'şeyden', 'şeyi', 'şeyler', 'şu', 'şuna', 'şunda', 'şundan', 'şunları', 'şunu', 'şöyle', 'ţayet', 'ţimdi', 'ţu', 'ţöyle'],
		en: ['a', 'apos', 'a’s', 'able', 'about', 'above', 'according', 'accordingly', 'across', 'actually', 'after', 'afterwards', 'again', 'against', 'ain’t', 'all', 'allow', 'allows', 'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'among', 'amongst', 'an', 'and', 'another', 'any', 'anybody', 'anyhow', 'anyone', 'anything', 'anyway', 'anyways', 'anywhere', 'apart', 'appear', 'appreciate', 'appropriate', 'are', 'aren’t', 'around', 'as', 'aside', 'ask', 'asking', 'associated', 'at', 'available', 'away', 'awfully', 'be', 'became', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'beforehand', 'behind', 'being', 'believe', 'below', 'beside', 'besides', 'best', 'better', 'between', 'beyond', 'both', 'brief', 'but', 'by', 'c’mon', 'c’s', 'came', 'can', 'can’t', 'cannot', 'cant', 'cause', 'causes', 'certain', 'certainly', 'changes', 'clearly', 'co', 'com', 'come', 'comes', 'concerning', 'consequently', 'consider', 'considering', 'contain', 'containing', 'contains', 'corresponding', 'could', 'couldn’t', 'course', 'currently', 'definitely', 'described', 'despite', 'did', 'didn’t', 'different', 'do', 'does', 'doesn’t', 'doing', 'don’t', 'done', 'down', 'downwards', 'during', 'each', 'edu', 'eg', 'eight', 'either', 'else', 'elsewhere', 'enough', 'entirely', 'especially', 'et', 'etc', 'even', 'ever', 'every', 'everybody', 'everyone', 'everything', 'everywhere', 'ex', 'exactly', 'example', 'except', 'far', 'few', 'fifth', 'first', 'five', 'followed', 'following', 'follows', 'for', 'former', 'formerly', 'forth', 'four', 'from', 'further', 'furthermore', 'get', 'gets', 'getting', 'given', 'gives', 'go', 'goes', 'going', 'gone', 'got', 'gotten', 'greetings', 'had', 'hadn’t', 'happens', 'hardly', 'has', 'hasn’t', 'have', 'haven’t', 'having', 'he', 'he’s', 'hello', 'help', 'hence', 'her', 'here', 'here’s', 'hereafter', 'hereby', 'herein', 'hereupon', 'hers', 'herself', 'hi', 'him', 'himself', 'his', 'hither', 'hopefully', 'how', 'howbeit', 'however', 'i', 'I', 'i’d', 'i’ll', 'i’m', 'i’ve', 'ie', 'if', 'ignored', 'immediate', 'in', 'inasmuch', 'inc', 'indeed', 'indicate', 'indicated', 'indicates', 'inner', 'insofar', 'instead', 'into', 'inward', 'is', 'isn’t', 'it', 'it’d', 'it’ll', 'it’s', 'its', 'itself', 'just', 'keep', 'keeps', 'kept', 'know', 'knows', 'known', 'last', 'lately', 'later', 'latter', 'latterly', 'least', 'less', 'lest', 'let', 'let’s', 'like', 'liked', 'likely', 'little', 'look', 'looking', 'looks', 'ltd', 'mainly', 'many', 'may', 'maybe', 'me', 'mean', 'meanwhile', 'merely', 'might', 'more', 'moreover', 'most', 'mostly', 'much', 'must', 'my', 'myself', 'name', 'namely', 'nd', 'near', 'nearly', 'necessary', 'need', 'needs', 'neither', 'never', 'nevertheless', 'new', 'next', 'nine', 'no', 'nobody', 'non', 'none', 'noone', 'nor', 'normally', 'not', 'nothing', 'novel', 'now', 'nowhere', 'obviously', 'of', 'off', 'often', 'oh', 'ok', 'okay', 'old', 'on', 'once', 'one', 'ones', 'only', 'onto', 'or', 'other', 'others', 'otherwise', 'ought', 'our', 'ours', 'ourselves', 'out', 'outside', 'over', 'overall', 'own', 'particular', 'particularly', 'per', 'perhaps', 'placed', 'please', 'plus', 'possible', 'presumably', 'probably', 'provides', 'que', 'quite', 'qv', 'rather', 'rd', 're', 'really', 'reasonably', 'regarding', 'regardless', 'regards', 'relatively', 'respectively', 'right', 'said', 'same', 'saw', 'say', 'saying', 'says', 'second', 'secondly', 'see', 'seeing', 'seem', 'seemed', 'seeming', 'seems', 'seen', 'self', 'selves', 'sensible', 'sent', 'serious', 'seriously', 'seven', 'several', 'shall', 'she', 'should', 'shouldn’t', 'since', 'six', 'so', 'some', 'somebody', 'somehow', 'someone', 'something', 'sometime', 'sometimes', 'somewhat', 'somewhere', 'soon', 'sorry', 'specified', 'specify', 'specifying', 'still', 'sub', 'such', 'sup', 'sure', 't’s', 'take', 'taken', 'tell', 'tends', 'th', 'than', 'thank', 'thanks', 'thanx', 'that', 'that’s', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'thence', 'there', 'there’s', 'thereafter', 'thereby', 'therefore', 'therein', 'theres', 'thereupon', 'these', 'they', 'they’d', 'they’ll', 'they’re', 'they’ve', 'think', 'third', 'this', 'thorough', 'thoroughly', 'those', 'though', 'three', 'through', 'throughout', 'thru', 'thus', 'to', 'together', 'too', 'took', 'toward', 'towards', 'tried', 'tries', 'truly', 'try', 'trying', 'twice', 'two', 'un', 'under', 'unfortunately', 'unless', 'unlikely', 'until', 'unto', 'up', 'upon', 'us', 'use', 'used', 'useful', 'uses', 'using', 'usually', 'value', 'various', 'very', 'via', 'viz', 'vs', 'want', 'wants', 'was', 'wasn’t', 'way', 'we', 'we’d', 'we’ll', 'we’re', 'we’ve', 'welcome', 'well', 'went', 'were', 'weren’t', 'what', 'what’s', 'whatever', 'when', 'whence', 'whenever', 'where', 'where’s', 'whereafter', 'whereas', 'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'which', 'while', 'whither', 'who', 'who’s', 'whoever', 'whole', 'whom', 'whose', 'why', 'will', 'willing', 'wish', 'with', 'within', 'without', 'won’t', 'wonder', 'would', 'would', 'wouldn’t', 'yes', 'yet', 'you', 'you’d', 'you’ll', 'you’re', 'you’ve', 'your', 'yours', 'yourself', 'yourselves', 'zero']
	}

};
