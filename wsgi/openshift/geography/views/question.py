# -*- coding: utf-8 -*-
from geography.utils import JsonResponse
from geography.models import Place
from django.http import Http404, HttpResponseBadRequest
from django.utils import simplejson
from lazysignup.decorators import allow_lazy_user
from geography.models import PlaceRelation, UserPlace
from geography.utils import QuestionService
from logging import getLogger
from django.contrib.auth.models import User
import geography.models.user
import math

LOGGER = getLogger(__name__)


@allow_lazy_user
def question(request, map_code):
    try:
        map = PlaceRelation.objects.get(
            place__code=map_code,
            type=PlaceRelation.IS_ON_MAP)
    except PlaceRelation.DoesNotExist:
        raise Http404
    qs = QuestionService(user=request.user, map_place=map)
    question_index = 0
    if request.raw_post_data:
        LOGGER.debug("processing raw answer %s", request.raw_post_data)
        answer = simplejson.loads(request.raw_post_data)
        qs.answer(answer)
        question_index = answer['index'] + 1
    if should_get_questions(request, question_index):
        response = qs.get_questions(10 - question_index)
    else:
        response = []
    return JsonResponse(response)


def should_get_questions(request, question_index):
    points = geography.models.user.get_points(request.user)
    return ((points <= 10
            or question_index % math.ceil(math.log(points, 10)) == 0)
            and question_index != 9)


def users_places(request, map_code, user=None):
    try:
        map = PlaceRelation.objects.get(
            place__code=map_code,
            type=PlaceRelation.IS_ON_MAP)
    except PlaceRelation.DoesNotExist:
        raise Http404("Unknown map name: {0}".format(map_code))
    if not user:
        user = request.user
    else:
        try:
            user = User.objects.get(username=user)
        except User.DoesNotExist:
            raise HttpResponseBadRequest("Invalid username: {0}" % user)

    if request.user.is_authenticated():
        ps = UserPlace.objects.for_user_and_map(user, map)
    else:
        ps = []
    response = {
        'name': map.place.name,
        'placesTypes': [
            {
                'name': place_type[1],
                'slug': place_type[0],
                'places': [p.to_serializable() for p in ps
                           if p.place.type == place_type[0]]
            } for place_type in Place.PLACE_TYPE_PLURALS
        ]
    }

    LOGGER.info(
        u"users_places: previewed map '{0}' of user '{1}' with '{2}' places".
        format(map.place.name, user, len(ps)))
    return JsonResponse(response)
