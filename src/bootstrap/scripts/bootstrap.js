/**
 * Created by BizNuge on 04/04/2017.
 */

/**
 * Toolkit JavaScript
 */

'use strict';

//var jQuery = require('jquery');


plugins:[
    new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery'
    })
]