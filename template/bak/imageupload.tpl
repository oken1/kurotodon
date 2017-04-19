<div class='account_select'>
</div>
<div id='imageupload_box'>
	<div id='imageuploadbox_service'>
		(i18n_0051)
		<div>
			<!--
				<div><input type='radio' name='imageupload_service' value='0' {if $service==0}checked{/if}><a href='http://twitpic.com/' target='_blank' class='anchor'>Twitpic</a></div>
			-->
			<div><input type='radio' name='imageupload_service' value='1' {if $service==1}checked{/if}><a href='http://p.twipple.jp/' target='_blank' class='anchor'>(i18n_0082)</a></div>
			<div><input type='radio' name='imageupload_service' value='2' {if $service==2}checked{/if}><a href='http://yfrog.com/' target='_blank' class='anchor'>yfrog</a></div>
		</div>
	</div>
	<div id='imageuploadbox_select'>
		<span id='selectfile'>(i18n_0119)</span>
		<input type='file' id='imageupload_input' accept='image/jpeg,image/png' name='media'>
	</div>
	<div id='imageuploadbox_btn'>
		<a class='btn img icon-folder-open tooltip' id='imageselectbtn' tooltip='(i18n_0120)'></a>
		<a class='btn' id='imageuploadbtn'>(i18n_0050)</a>
	</div>
</div>
