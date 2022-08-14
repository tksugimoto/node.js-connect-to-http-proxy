package todoapp

import (
	"dagger.io/dagger"
	"dagger.io/dagger/core"
	"universe.dagger.io/yarn"
)

dagger.#Plan & {
	client: filesystem: {
		"package.json": {
			read: {
				path: "."
				include: [
					"package-lock.json",
					"package.json",
				]
			}
		}
		source: {
			read: {
				path: "."
				include: [
					"connect.js",
					"connect.test.js",
				]
			}
		}
	}
	actions: {
		_install: yarn.#Command & {
			args: ["install"]
			source: client.filesystem["package.json"].read.contents
		}
		_allFiles: core.#Merge & {
			inputs: [
				_install.source,
				client.filesystem["source"].read.contents,
			]
		}
		test: yarn.#Command & {
			args: ["run", "test"]
			source: _allFiles.output
			container: mounts: install_output: { // 事前に _install を実行させるため: https://github.com/dagger/dagger/blob/v0.2.23/pkg/universe.dagger.io/yarn/yarn.cue#L53-L59
				contents: _install.output
				dest: "/tmp/yarn_install_output"
			}
		}
	}
}
