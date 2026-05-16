# Last Task Failure

The last task was marked as failed because the patch response returned an empty `changes` array. That meant no file was created, updated, or deleted, so the review system could not produce a reviewable diff.

In this workflow, even explanation-only requests still need a concrete repository change when the edit step is reached. This note records the reason for the failure in the smallest possible way.
