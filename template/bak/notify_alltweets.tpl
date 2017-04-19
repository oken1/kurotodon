<div class='notify' account_id='{$account_id}'>
	<div class='tbl'>
		<div class='tc icon'>
			<img src='{$simg}' class='normal'>
		</div>
		<div class='tc'>
			<div class='tbl bold'>
				<span class='notify_username' src='{$src}'>{$src}</span>
			</div>
			{if $rtsrc}
			<div class='tbl'>
				<span class='rt'>{if $rtcnt >0}(i18n_0004){else}(i18n_0003){/if}</span>
			</div>
			{/if}
			<div class='tbl'>
				{$msg}
			</div>
			<div class='tbl date'>
				{$date}
			</div>
		</div>
	</div>
</div>
