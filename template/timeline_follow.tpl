<div class='item notification' id='{$id}' instance='{$instance}' display_name='{$display_name}' avatar='{$avatar}' username='{$username}' status_id='{$status_id}' created_at='{$created_at}'>
	<div class='avatar'>
		<img class='tooltip' src='{$avatar}' tooltip='(i18n_0367):{$statuses_count} (i18n_0125):{$following} (i18n_0122):{$followers}'>
	</div>
	<div class='toot'>
		<div class='notification' id='{$notification->id}' username='{$notification->username}' display_name='{$notification->display_name}' instance='{$notification->instance}'>
			<span class='display_name'>{$notification->display_name_disp}</span>(i18n_0372)<br>
			<span class='acct'>{$notification->username}@{$notification->instance}</span>
		</div>
	</div>
</div>
