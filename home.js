const SUPABASE_URL = "https://avvwhsoikoybszrlkjzl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_dkf8SxvQ8q1jw_tCPiHA8g_ulProIqn";

const { createClient } = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* =========================
   USER
========================= */

let currentUser = null;
let currentUserName = "BUTYVO User";


async function loadUser() {
  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.href = "index.html";
    return null;
  }

  currentUser = user;

  currentUserName =
    user.user_metadata?.full_name ||
    user.email ||
    "BUTYVO User";

  const firstLetter =
    currentUserName.charAt(0).toUpperCase();

  document.getElementById("userName").textContent =
    currentUserName;

  document.getElementById("profileName").textContent =
    currentUserName;

  document.getElementById("profileEmail").textContent =
    user.email;

  document.getElementById("profileAvatar").textContent =
    firstLetter;

  return user;
}


/* =========================
   NAVIGATION
========================= */

const navItems = document.querySelectorAll(
  ".nav-item, .create-nav"
);

const pages = document.querySelectorAll(".page");

navItems.forEach(function (item) {

  item.addEventListener("click", function () {

    const pageId = item.dataset.page;

    pages.forEach(function (page) {
      page.classList.remove("active-page");
    });

    document
      .getElementById(pageId)
      .classList.add("active-page");

    navItems.forEach(function (nav) {
      nav.classList.remove("active");
    });

    if (item.classList.contains("nav-item")) {
      item.classList.add("active");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


/* =========================
   CHARACTER COUNTER
========================= */

const postText =
  document.getElementById("postText");

const characterCount =
  document.getElementById("characterCount");

postText.addEventListener("input", function () {

  characterCount.textContent =
    postText.value.length + " / 500";

});


/* =========================
   CREATE POST
========================= */

document
  .getElementById("postBtn")
  .addEventListener("click", async function () {

    const text =
      postText.value.trim();

    if (!text) {
      alert("Please write something first.");
      return;
    }

    if (text.length > 500) {
      alert("Post cannot be longer than 500 characters.");
      return;
    }

    if (!currentUser) {
      await loadUser();
    }

    if (!currentUser) {
      alert("Please login again.");
      return;
    }

    const button =
      document.getElementById("postBtn");

    button.disabled = true;
    button.textContent = "Posting...";

    const { error } =
      await supabaseClient
        .from("posts")
        .insert({
          user_id: currentUser.id,
          content: text
        });

    if (error) {

      console.error(error);

      alert(
        "Could not create post:\n" +
        error.message
      );

      button.disabled = false;
      button.textContent = "Post";

      return;
    }

    postText.value = "";
    characterCount.textContent = "0 / 500";

    button.disabled = false;
    button.textContent = "Post";

    await loadPosts();

    pages.forEach(function (page) {
      page.classList.remove("active-page");
    });

    document
      .getElementById("homePage")
      .classList.add("active-page");

    navItems.forEach(function (nav) {
      nav.classList.remove("active");
    });

    document
      .querySelector('[data-page="homePage"]')
      .classList.add("active");

  });


/* =========================
   LOAD POSTS
========================= */

async function loadPosts() {

  const {
    data: posts,
    error
  } = await supabaseClient
    .from("posts")
    .select("id, content, created_at, user_id")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(
      "Post loading error:",
      error
    );

    return;
  }

  const feed =
    document.querySelector(".empty-feed");

  if (!feed) {
    return;
  }

  if (!posts || posts.length === 0) {

    feed.innerHTML = `
      <div class="empty-icon">✦</div>
      <h3>Your feed is waiting</h3>
      <p>Posts from your friends will appear here.</p>
    `;

    return;
  }


  /* Get likes */

  const {
    data: likes,
    error: likesError
  } = await supabaseClient
    .from("post_likes")
    .select("post_id, user_id");

  if (likesError) {
    console.error("Likes loading error:", likesError);
  }


  /* Get comments */

  const {
    data: comments,
    error: commentsError
  } = await supabaseClient
    .from("comments")
    .select("id, post_id, user_id, content, created_at")
    .order("created_at", {
      ascending: true
    });

  if (commentsError) {
    console.error(
      "Comments loading error:",
      commentsError
    );
  }


  feed.innerHTML = posts.map(function (post) {

    const postLikes =
      (likes || []).filter(function (like) {
        return like.post_id === post.id;
      });

    const postComments =
      (comments || []).filter(function (comment) {
        return comment.post_id === post.id;
      });

    const likedByMe =
      postLikes.some(function (like) {
        return like.user_id === currentUser.id;
      });

    const date =
      new Date(post.created_at);

    const isMyPost =
      currentUser &&
      post.user_id === currentUser.id;


    const commentsHTML =
      postComments.map(function (comment) {

        const commentDate =
          new Date(comment.created_at);

        const isMyComment =
          comment.user_id === currentUser.id;

        return `
          <div class="comment-item">

            <div class="comment-avatar">
              ${comment.user_id === currentUser.id
                ? escapeHTML(
                    currentUserName
                      .charAt(0)
                      .toUpperCase()
                  )
                : "U"
              }
            </div>

            <div class="comment-body">

              <strong>
                ${
                  comment.user_id === currentUser.id
                    ? escapeHTML(currentUserName)
                    : "BUTYVO User"
                }
              </strong>

              <p>
                ${escapeHTML(comment.content)}
              </p>

              <small>
                ${commentDate.toLocaleString()}
              </small>

            </div>

            ${
              isMyComment
                ? `
                  <button
                    class="delete-comment"
                    data-id="${comment.id}"
                  >
                    ×
                  </button>
                `
                : ""
            }

          </div>
        `;

      }).join("");


    return `

      <article class="post-card">

        <div class="post-header">

          <div class="post-avatar">
            ${
              isMyPost
                ? escapeHTML(
                    currentUserName
                      .charAt(0)
                      .toUpperCase()
                  )
                : "U"
            }
          </div>

          <div class="post-user">

            <strong>
              ${
                isMyPost
                  ? escapeHTML(currentUserName)
                  : "BUTYVO User"
              }
            </strong>

            <small>
              ${date.toLocaleString()}
            </small>

          </div>

          ${
            isMyPost
              ? `
                <button
                  class="delete-post"
                  data-id="${post.id}"
                >
                  Delete
                </button>
              `
              : ""
          }

        </div>


        <p class="post-content">
          ${escapeHTML(post.content)}
        </p>


        <div class="post-actions">

          <button
            class="post-action like-button ${
              likedByMe ? "liked" : ""
            }"
            data-id="${post.id}"
          >
            ${likedByMe ? "♥" : "♡"}
            Like
            <span>${postLikes.length}</span>
          </button>

          <button
            class="post-action comment-toggle"
            data-id="${post.id}"
          >
            💬 Comment
            <span>${postComments.length}</span>
          </button>

        </div>


        <div
          class="comments-area"
          id="comments-${post.id}"
        >

          ${
            commentsHTML ||
            `
              <p class="no-comments">
                No comments yet.
              </p>
            `
          }

          <div class="comment-form">

            <input
              type="text"
              class="comment-input"
              data-id="${post.id}"
              maxlength="300"
              placeholder="Write a comment..."
            >

            <button
              class="comment-submit"
              data-id="${post.id}"
            >
              Send
            </button>

          </div>

        </div>

      </article>

    `;

  }).join("");


  attachPostEvents();

}


/* =========================
   POST EVENTS
========================= */

function attachPostEvents() {


  /* LIKE */

  document
    .querySelectorAll(".like-button")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        async function () {

          await toggleLike(
            button.dataset.id
          );

        }
      );

    });


  /* COMMENTS */

  document
    .querySelectorAll(".comment-submit")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        async function () {

          await addComment(
            button.dataset.id
          );

        }
      );

    });


  /* DELETE POST */

  document
    .querySelectorAll(".delete-post")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        async function () {

          await deletePost(
            button.dataset.id
          );

        }
      );

    });


  /* DELETE COMMENT */

  document
    .querySelectorAll(".delete-comment")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        async function () {

          await deleteComment(
            button.dataset.id
          );

        }
      );

    });


  /* COMMENT ENTER */

  document
    .querySelectorAll(".comment-input")
    .forEach(function (input) {

      input.addEventListener(
        "keydown",
        async function (event) {

          if (event.key === "Enter") {

            event.preventDefault();

            await addComment(
              input.dataset.id
            );

          }

        }
      );

    });

}


/* =========================
   LIKE / UNLIKE
========================= */

async function toggleLike(postId) {


  const {
    data: existingLike,
    error: findError
  } = await supabaseClient
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", currentUser.id)
    .maybeSingle();


  if (findError) {

    alert(
      "Could not check like:\n" +
      findError.message
    );

    return;
  }


  if (existingLike) {

    const { error } =
      await supabaseClient
        .from("post_likes")
        .delete()
        .eq("id", existingLike.id);

    if (error) {

      alert(
        "Could not remove like:\n" +
        error.message
      );

      return;
    }

  } else {

    const { error } =
      await supabaseClient
        .from("post_likes")
        .insert({
          post_id: Number(postId),
          user_id: currentUser.id
        });

    if (error) {

      alert(
        "Could not like post:\n" +
        error.message
      );

      return;
    }

  }


  await loadPosts();

}


/* =========================
   ADD COMMENT
========================= */

async function addComment(postId) {


  const input =
    document.querySelector(
      `.comment-input[data-id="${postId}"]`
    );


  if (!input) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {

    alert("Write a comment first.");

    return;
  }


  if (text.length > 300) {

    alert(
      "Comment cannot be longer than 300 characters."
    );

    return;
  }


  const { error } =
    await supabaseClient
      .from("comments")
      .insert({

        post_id: Number(postId),

        user_id: currentUser.id,

        content: text

      });


  if (error) {

    alert(
      "Could not add comment:\n" +
      error.message
    );

    return;
  }


  await loadPosts();

}


/* =========================
   DELETE COMMENT
========================= */

async function deleteComment(commentId) {


  const confirmDelete =
    confirm(
      "Delete this comment?"
    );


  if (!confirmDelete) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUser.id);


  if (error) {

    alert(
      "Could not delete comment:\n" +
      error.message
    );

    return;
  }


  await loadPosts();

}


/* =========================
   DELETE POST
========================= */

async function deletePost(postId) {


  const confirmDelete =
    confirm(
      "Are you sure you want to delete this post?"
    );


  if (!confirmDelete) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", currentUser.id);


  if (error) {

    alert(
      "Could not delete post:\n" +
      error.message
    );

    return;
  }


  await loadPosts();

}


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent = text;

  return div.innerHTML;

}


/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    async function () {

      await supabaseClient.auth.signOut();

      window.location.href =
        "index.html";

    }
  );


/* =========================
   START APP
========================= */

async function startApp() {

  const user =
    await loadUser();

  if (!user) {
    return;
  }

  await loadPosts();

}

startApp();// ================================
// FRIEND SEARCH & FRIEND REQUESTS
// ================================

const friendSearchInput =
  document.getElementById("friendSearchInput");

const friendSearchResults =
  document.getElementById("friendSearchResults");

const friendsEmpty =
  document.getElementById("friendsEmpty");

if (friendSearchInput) {
  friendSearchInput.addEventListener("input", async function () {
    const searchText =
      friendSearchInput.value.trim();

    if (!searchText) {
      friendSearchResults.innerHTML = "";
      friendsEmpty.style.display = "block";
      return;
    }

    if (!currentUser) {
      await loadUser();
    }

    const {
      data: profiles,
      error
    } = await supabaseClient
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", "%" + searchText + "%")
      .neq("id", currentUser.id)
      .limit(20);

    if (error) {
      console.error(error);
      friendSearchResults.innerHTML =
        "<p>Could not search users.</p>";
      return;
    }

    friendsEmpty.style.display = "none";

    if (!profiles || profiles.length === 0) {
      friendSearchResults.innerHTML = `
        <div class="empty-feed">
          <div class="empty-icon">⌕</div>
          <h3>No people found</h3>
          <p>Try another name.</p>
        </div>
      `;
      return;
    }

    friendSearchResults.innerHTML =
      profiles.map(function (profile) {
        return `
          <div class="friend-result">
            <div class="friend-avatar">
              ${escapeHTML(
                profile.full_name
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            <div class="friend-info">
              <strong>
                ${escapeHTML(profile.full_name)}
              </strong>
              <small>BUTYVO user</small>
            </div>

            <button
              class="send-request-btn"
              data-user-id="${profile.id}"
            >
              Add Friend
            </button>
          </div>
        `;
      }).join("");

    attachFriendEvents();
  });
}

function attachFriendEvents() {
  document
    .querySelectorAll(".send-request-btn")
    .forEach(function (button) {
      button.addEventListener(
        "click",
        async function () {
          await sendFriendRequest(
            button.dataset.userId,
            button
          );
        }
      );
    });
}

async function sendFriendRequest(
  receiverId,
  button
) {
  if (!currentUser) {
    await loadUser();
  }

  button.disabled = true;
  button.textContent = "Sending...";

  const {
    error
  } = await supabaseClient
    .from("friend_requests")
    .insert({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      status: "pending"
    });

  if (error) {
    console.error(error);

    if (
      error.code === "23505"
    ) {
      alert("Friend request already sent.");
    } else {
      alert(
        "Could not send request:\n" +
        error.message
      );
    }

    button.disabled = false;
    button.textContent = "Add Friend";
    return;
  }

  button.textContent = "Request Sent";
  button.disabled = true;
}
// =========================
// BUTYVO VIDEO FEED
// =========================

async function loadVideos() {
  const videoFeed = document.getElementById("videoFeed");
  const videoEmpty = document.getElementById("videoEmpty");

  if (!videoFeed) return;

  const { data: videos, error } = await supabaseClient
    .from("videos")
    .select("id, user_id, storage_path, caption, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Video loading error:", error);
    return;
  }

  if (!videos || videos.length === 0) {
    if (videoEmpty) videoEmpty.style.display = "block";
    return;
  }

  if (videoEmpty) videoEmpty.style.display = "none";

  videoFeed.innerHTML = "";

  videos.forEach((video) => {
    const { data } = supabaseClient
      .storage
      .from("videos")
      .getPublicUrl(video.storage_path);

    const videoCard = document.createElement("div");
    videoCard.className = "video-card";

    videoCard.innerHTML = `
      <video
        class="butyvo-video"
        src="${data.publicUrl}"
        controls
        playsinline
        preload="metadata">
      </video>

      <div class="video-info">
        <strong>BUTYVO User</strong>
        <p>${escapeHTML(video.caption || "")}</p>
      </div>
    `;

    videoFeed.appendChild(videoCard);
  });
}
// =========================
// VIDEO UPLOAD
// =========================

const videoInput =
  document.getElementById("videoInput");

const videoCaption =
  document.getElementById("videoCaption");

const videoUploadBtn =
  document.getElementById("videoUploadBtn");

const videoUploadStatus =
  document.getElementById("videoUploadStatus");


if (videoInput) {

  videoInput.addEventListener("change", function () {

    const file = videoInput.files[0];

    if (file) {
      videoUploadStatus.textContent =
        "Selected: " + file.name;
    } else {
      videoUploadStatus.textContent =
        "No video selected.";
    }

  });

}


if (videoUploadBtn) {

  videoUploadBtn.addEventListener(
    "click",
    async function () {

      const file =
        videoInput.files[0];

      const caption =
        videoCaption.value.trim();


      if (!file) {

        alert(
          "Please choose a video first."
        );

        return;
      }


      if (!currentUser) {

        alert(
          "Please log in first."
        );

        return;
      }


      videoUploadBtn.disabled = true;

      videoUploadStatus.textContent =
        "Uploading video...";


      const safeFileName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );


      const fileName =
        currentUser.id +
        "/" +
        Date.now() +
        "-" +
        safeFileName;


      const {
        error: uploadError
      } = await supabaseClient
        .storage
        .from("videos")
        .upload(
          fileName,
          file
        );


      if (uploadError) {

        console.error(
          "Upload error:",
          uploadError
        );

        videoUploadStatus.textContent =
          "Upload failed: " +
          uploadError.message;

        videoUploadBtn.disabled =
          false;

        return;
      }


      const {
        error: databaseError
      } = await supabaseClient
        .from("videos")
        .insert({

          user_id:
            currentUser.id,

          storage_path:
            fileName,

          caption:
            caption

        });


      if (databaseError) {

        console.error(
          "Database error:",
          databaseError
        );

        videoUploadStatus.textContent =
          "Video uploaded, but saving failed.";

        videoUploadBtn.disabled =
          false;

        return;
      }


      videoUploadStatus.textContent =
        "Video uploaded successfully!";


      videoInput.value = "";

      videoCaption.value = "";


      await loadVideos();


      videoUploadBtn.disabled =
        false;

    }
  );

}


