			<div class='menubox'>
				{if $type!='peep'}
				<a class='btn toolbaruser' toolbaruser='{$toolbaruser}'>{if $toolbaruser}(i18n_0091){else}(i18n_0092){/if}</a>
				<a class='btn expandstatus'>(i18n_0404)</a>
				{else}
				<a class='btn remotefollow'>(i18n_0025)</a>
				<div class='remote_account_list follow_account'>
				</div>
				{/if}
				<a class='btn speech'>speech</a>
				<a class='btn boost_other'>(i18n_0411)</span></a>
				<div class='remote_account_list boost_account'>
				</div>
				<a class='btn favorite_other'>(i18n_0412)</a>
				<div class='remote_account_list favorite_account'>
				</div>
				<a class='btn import_color'>(i18n_0424)</a>
			</div>
