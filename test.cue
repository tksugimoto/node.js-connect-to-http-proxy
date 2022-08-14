package todoapp

import (
	"dagger.io/dagger"
	"universe.dagger.io/yarn"
)

dagger.#Plan & {
	client: filesystem: {
		source: {
			read: {
				path: "."
				include: [
					"connect.js",
					"connect.test.js",
					"package-lock.json",
					"package.json",
				]
			}
		}
	}
	actions: {
		test: yarn.#Script & {
			name: "test"
			source: client.filesystem.source.read.contents
		}
	}
}
