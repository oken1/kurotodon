			<div class='menubox'>
				{if $type!='peep'}
				<a class='btn toolbaruser' toolbaruser='{$toolbaruser}'>{if $toolbaruser}(i18n_0091){else}(i18n_0092){/if}</a>
				<a class='btn expandstatus'>(i18n_0404)</a>
				{else}
				<a class='btn remotefollow'>(i18n_0025)</a>
				<div class='remote_account_list'>
				</div>
				{/if}
				<a class='btn speech'>speech</a>
			</div>
