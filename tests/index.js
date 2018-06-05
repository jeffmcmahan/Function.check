'use strict'

void async function () {
	await require('./core')()
	require('./error')
}()
