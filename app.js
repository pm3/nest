function RoomMnager(){

	var self = this;
	this.roomId = null;
	this.roomIds = ['dashboard'];

	this.callUserInfo = function(){
		//zavola servie user info, vysledok spracuje v call back funkcii
		$.getJSON( "/nest/user/user-info", self.responseUserInfo);
	}	
	
	this.responseUserInfo = function(data){
		//do logu vypisem data co prisli
		console.log(data);
		//najdem element h1 a pripisem na koniec nick uzivatela
		$("h1").html("Dashboar "+data.nick);
		//najdem element ul#room_list do ktoreho neskor vpisem zoznam miestnosti
		var room_list = $("#room_list");
		//vymazem children ktore zozstali z prototypu
		//prejdem v cykle vsetky miestnosti
		$(data.rooms).each(function(){
			//do room_list pridam element li s popisom miestnosti
			room_list.append('<li id="li_'+this.id+'"><a href="#'+this.id+'">'+this.name+'</a></li>');
			self.roomIds.push(""+this.id);
		});
	}

	this.postTpl = '<div class="row feed_post">'+$("div.feed_post").html()+'</div>';
	this.feed = $("#feed");
	this.feed.empty();

	this.showRoom = function(id){
		id = id.substring(1);
		if(self.roomId!=id && $.inArray(id, self.roomIds)>=0){
			self.roomId=id;
			self.activeRoomLink();
			self.feed.empty();
			if(id=='dashboard') {
				self.callMessagesDashboard(0);
				this.newPostEl.hide();
			} else {
				self.callMessagesRoom(id, 0);
				this.newPostEl.show();
			}
		}
	}
	
	this.activeRoomLink = function(){
		$("#room_list > li.active").removeClass("active");
		$("#li_"+self.roomId).addClass("active");
	}

	//nacitam zoznam message z dashboardu
	this.callMessagesDashboard = function(last){
		$.ajax({
			dataType: "json",
			url: "/nest/user/select-dashboard-messages",
			data: { last : last },
			success: self.showMessages
		});
	};

	//nacitam zoznam message z dashboardu
	this.callMessagesRoom = function(roomId, last){
		$.ajax({
			dataType: "json",
			url: "/nest/user/select-room-messages",
			data: { roomId: roomId, last : last },
			success: self.showMessages
		});
	};
	
	this.showMessages = function(data){
		//do logu vypisem data co prisli
		console.log(data);
		$(data).each(function(index, msgObj){ self.showMessage(index,msgObj, self.feed); });
	};

	this.showMessage = function(index, msgObj, parent, first){
		var msgEl = $(self.postTpl);
		msgEl.data('mid', msgObj.id);
		if(msgObj.creatorAvatarImg) $(".post_avatar", msgEl).attr('src', "/nest"+msgObj.creatorAvatarImg);
		$(".post_owner", msgEl).text(msgObj.creatorNick);
		$(".post_text", msgEl).text(msgObj.text);
		$(".post_like", msgEl).text(msgObj.likes);
		if(msgObj.type=='post') {
			$(".post_add_comment", msgEl).click(function(e){
				try{
					self.addCommentForm(msgEl, msgObj.id);
				}catch(err){ console.log(err);}
				e.stopPropagation();
				return false;
			});
		} else {
			$(".post_add_comment", msgEl).hide();
		}
		$(".post_like_click", msgEl).click(function(e){
			$.getJSON( "/nest/user/add-like?messageId="+msgObj.id, function( data2 ) {
				$(".post_like", msgEl).text(data2);
			});
			e.stopPropagation();
			return false;
		});
		if(first) msgEl.prependTo(parent);
		else msgEl.appendTo(parent);
		if(msgObj.children){
			var comments = $(".post_messages", msgEl);
			$(msgObj.children).each(function(index, msgObj){ self.showMessage(index,msgObj, comments); });
		}
	};
	
	this.addCommentForm = function(parentEl, postId){
		var formEl = $(self.newPostTpl);
		var messagesEl = $(".post_messages", parentEl).first();
		messagesEl.append(formEl);
		$(".new_send", this.formEl).click(function(e){
			var text = $(".new_text", formEl).val();
			$.ajax({
				dataType: "json",
				url: "/nest/user/create-comment",
				data: { parentId: postId, comment : text },
				success: function(data) { 
					formEl.detach();
					$(".new_post_text", formEl).val("");
					self.showMessage(0, data, messagesEl); 
				}
			});
			e.stopPropagation();
			return false;
		});
	};
	
	this.newPostEl = $("#new_post");
	this.newPostEl.hide();
	this.newPostTpl = '<div class="panel panel-default" id="new_post">'+$("#new_post").html()+'</div>';
	$(".new_send", this.newPostEl).click(function(e){
		var text = $(".new_text", self.newPostEl).val();
		$.ajax({
			dataType: "json",
			url: "/nest/user/create-post",
			data: { roomId: self.roomId, post : text },
			success: function(data) { 
				$(".new_text", self.newPostEl).val("");
				self.showMessage(0, data, self.feed, true); 
			}
		});
		e.stopPropagation();
		return false;
	});
};	