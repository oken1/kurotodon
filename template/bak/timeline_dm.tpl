	<div class='item' screen_name='{$screen_name}' user_id='{$user_id}' status_id='{$status_id}' created_at='{$created_at}'>
		<div class='icon'>
			<img src='{$icon}'>
		</div>
		<div class='tweet'>
			<div class='headcontainer'>
				<div class='namedate'>
					{if $namedisp==0}
						<span class='atmark ndr'>@</span><span class='screen_name ndr'>{$screen_name}</span> {if $name}<span class='name ndr'>{$name}</span>{/if}
					{else}
						{if $name}<span class='name drc'>{$name}</span>{/if}<span class='atmark drc'> @</span><span class='screen_name drc'>{$screen_name}</span>
					{/if}
					{if $ismutual}<span class='icon-arrow-left'></span><span class='icon-arrow-right'></span>{/if}
					{if $isfriend}<span class='icon-arrow-left'></span>{/if}
					{if $isfollower}<span class='icon-arrow-right'></span>{/if}
					<br>
					<span class='date tooltip' absdate='{$absdate}' tooltip='{$date}'>{$dispdate}</span>
				</div>
				<div class='options'>
				</div>
			</div>
			<div class='tweet_text'>{$text}</div>
		</div>
	</div>
